const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

//Modular Imports
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth"); // <-- NEW Auth import

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./serviceAccountKey.json");

//Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

// Initialize your database
const db = getFirestore();

// 3. Updated Auth Guard Middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If there is no token, reject the request
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using the modular getAuth() function
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken; // Attach the user info to the request
    next(); // The badge is valid, let them through to the route!
  } catch (error) {
    console.error("Token verification failed:", error);
    return res
      .status(403)
      .json({ error: "Forbidden: Expired or invalid token." });
  }
};

const app = express();

// --- Cloudinary Setup ---
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "constay-news",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- 1. POST Endpoint (Create Article) ---
app.post(
  "/api/news",
  verifyToken,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const {
        title,
        snippet,
        content,
        imageUrl,
        imageCaption,
        imageCredit,
        authorName,
        status,
      } = req.body;

      const authorId = req.user.uid;

      if (!title || !content || !authorId) {
        return res
          .status(400)
          .json({ error: "Title, content, and authorId are required." });
      }

      // Decide which image URL to save (File upload vs. Pasted Link)
      let finalImageUrl = "";
      if (req.file) {
        finalImageUrl = req.file.path; // Cloudinary successfully uploaded the file
      } else if (imageUrl) {
        finalImageUrl = imageUrl; // The user pasted a web link
      }

      const newArticleRef = db.collection("news").doc();
      const articleData = {
        title,
        snippet: snippet || "",
        content,
        imageUrl: finalImageUrl,
        imageCaption: imageCaption || "",
        imageCredit: imageCredit || "",
        authorId,
        authorName: authorName || "CON Contributor",
        status: status === "draft" ? "draft" : "published",
        date: FieldValue.serverTimestamp(),
      };

      await newArticleRef.set(articleData);

      res.status(201).json({
        message: "Article created successfully!",
        id: newArticleRef.id,
      });
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  },
);

// Public GET route with Pagination (and Admin 'all' bypass)
app.get("/api/news", async (req, res) => {
  try {
    const fetchAll = req.query.all === "true";
    const page = parseInt(req.query.page) || 1;
    const limitCount = 4;
    const offsetCount = (page - 1) * limitCount;

    const snapshot = await db.collection("news").orderBy("date", "desc").get();

    const allArticles = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamp to readable text
      let formattedDate = data.date;
      if (data.date && typeof data.date.toDate === "function") {
        formattedDate = data.date.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      allArticles.push({
        id: doc.id,
        ...data,
        date: formattedDate,
        authorName: data.authorName || "CON Contributor",
        status: data.status || "published", // Default older articles to 'published'
      });
    });

    // If requested by the Admin Dashboard (?all=true), return everything (including drafts)
    if (fetchAll) {
      return res.json(allArticles);
    }

    // For the public homepage, filter out drafts first, then slice the 4-article batch
    const publishedArticles = allArticles.filter(
      (article) => article.status === "published",
    );
    const paginatedArticles = publishedArticles.slice(
      offsetCount,
      offsetCount + limitCount,
    );

    res.json(paginatedArticles);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch articles." });
  }
});

// --- GET Endpoint (Single Article) ---
app.get("/api/news/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    const docRef = db.collection("news").doc(articleId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Article not found." });
    }

    const data = doc.data();
    const authorName = await getAuthorName(data.authorId);

    const formattedDate = data.date
      ? data.date.toDate().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "No date";

    res.status(200).json({
      id: doc.id,
      ...data,
      date: formattedDate,
      authorName: authorName,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

// --- 4. DELETE Endpoint (Remove Article) ---
app.delete(
  "/api/news/:id",
  verifyToken,
  verifyArticleOwnership,
  async (req, res) => {
    try {
      const articleId = req.params.id;

      // 1. If the article had a Cloudinary image, delete it from storage
      if (req.articleData && req.articleData.imageUrl) {
        await deleteCloudinaryImage(req.articleData.imageUrl);
      }

      // 2. Delete the article document from Firestore
      await db.collection("news").doc(articleId).delete();
      res.status(200).json({ message: "Article deleted successfully." });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  },
);

// --- 5. PUT Endpoint (Update Article) ---
app.put(
  "/api/news/:id",
  verifyToken,
  verifyArticleOwnership,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const articleId = req.params.id;
      const oldImageUrl = req.articleData ? req.articleData.imageUrl : "";
      const {
        title,
        snippet,
        content,
        imageUrl,
        imageCaption,
        imageCredit,
        lastEditedBy,
        status,
      } = req.body;

      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required." });
      }

      let updateData = {
        title,
        snippet: snippet || "",
        content,
        imageCaption: imageCaption || "",
        imageCredit: imageCredit || "",
        status: status === "draft" ? "draft" : "published",
        lastEditedBy: lastEditedBy || "Admin",
        lastUpdatedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      // Handle image updates and old Cloudinary cleanup
      if (req.file) {
        // User uploaded a brand new file -> delete the old Cloudinary image
        if (oldImageUrl) {
          await deleteCloudinaryImage(oldImageUrl);
        }
        updateData.imageUrl = req.file.path;
      } else if (imageUrl !== undefined) {
        // User switched to "No Image" ("") or pasted a different link -> delete old Cloudinary image
        if (oldImageUrl && imageUrl !== oldImageUrl) {
          await deleteCloudinaryImage(oldImageUrl);
        }
        updateData.imageUrl = imageUrl;
      }

      await db.collection("news").doc(articleId).update(updateData);

      res.status(200).json({ message: "Article updated successfully!" });
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  },
);

// --- Helper Function ---
// --- Helper: Delete Image from Cloudinary ---
async function deleteCloudinaryImage(imageUrl) {
  // Ignore empty strings or external web links not hosted on our Cloudinary
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;

  try {
    // Extract "constay-news/filename" without the file extension (.jpg, .png, etc.)
    const match = imageUrl.match(/constay-news\/[^.]+/);
    if (match && match[0]) {
      const publicId = match[0];
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted old Cloudinary image: ${publicId}`);
    }
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
  }
}

// --- Middleware: Verify Article Ownership or Admin Status ---
async function verifyArticleOwnership(req, res, next) {
  try {
    const articleId = req.params.id;
    const articleRef = db.collection("news").doc(articleId);
    const articleDoc = await articleRef.get();

    if (!articleDoc.exists) {
      return res.status(404).json({ error: "Article not found." });
    }

    const articleData = articleDoc.data();
    const requesterUid = req.user.uid; // Attached earlier by verifyToken

    // 1. Check if the requester is the original author of the article
    const isOwner = articleData.authorId === requesterUid;

    // 2. If not the owner, check Firestore to see if they are an Admin
    let isAdmin = false;
    if (!isOwner) {
      const userDoc = await db.collection("users").doc(requesterUid).get();
      if (userDoc.exists && userDoc.data().isAdmin === true) {
        isAdmin = true;
      }
    }

    // 3. Reject if they are neither the author nor an admin
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error:
          "Forbidden: You only have permission to modify your own articles.",
      });
    }

    // Attach the existing article data so the route doesn't have to fetch it again
    req.articleData = articleData;
    next();
  } catch (error) {
    console.error("Ownership verification error:", error);
    return res.status(500).json({ error: "Failed to verify permissions." });
  }
}

async function getAuthorName(authorId) {
  if (!authorId) return "Unknown Author";
  try {
    const userRef = db.collection("users").doc(authorId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return userDoc.data().name || "Unknown Author";
    }
  } catch (error) {
    console.error("Error fetching author name:", error);
  }
  return "Unknown Author";
}

// --- Global Error Handler (Catches Multer / Cloudinary Upload Errors) ---
app.use((err, req, res, next) => {
  console.error("Upload/Server Error:", err);

  // Format Cloudinary's byte message into something friendly if it's a size issue
  if (err.message && err.message.includes("File size too large")) {
    return res.status(400).json({
      error: "Image file is too large. Maximum allowed size is 5MB.",
    });
  }

  res.status(err.http_code || 500).json({
    error: err.message || "An unexpected error occurred during upload.",
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
