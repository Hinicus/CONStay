const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

//Modular Imports
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth"); // <-- NEW Auth import

const serviceAccount = require("./serviceAccountKey.json");

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
const upload = multer({ storage: storage });

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
        authorId,
        authorName,
      } = req.body;

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

// Public GET route with Pagination
app.get("/api/news", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitCount = 6;
    const offsetCount = (page - 1) * limitCount;

    const snapshot = await db
      .collection("news")
      .orderBy("date", "desc")
      .offset(offsetCount)
      .limit(limitCount)
      .get();

    const articles = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // 1. FIX THE DATE: Convert Firestore Timestamp to readable text
      let formattedDate = data.date;
      if (data.date && typeof data.date.toDate === "function") {
        formattedDate = data.date.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      articles.push({
        id: doc.id,
        ...data,
        // 2. Overwrite the broken data with our fixed versions
        date: formattedDate,
        authorName: data.authorName || "CON Contributor", // Fallback for missing names
      });
    });

    res.json(articles);
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
app.delete("/api/news/:id", verifyToken, async (req, res) => {
  try {
    const articleId = req.params.id;
    await db.collection("news").doc(articleId).delete();
    res.status(200).json({ message: "Article deleted successfully." });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ error: "Failed to delete article" });
  }
});

// --- 5. PUT Endpoint (Update Article) ---
app.put(
  "/api/news/:id",
  verifyToken,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const articleId = req.params.id;
      const {
        title,
        snippet,
        content,
        imageUrl,
        imageCaption,
        imageCredit,
        lastEditedBy,
      } = req.body;

      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required." });
      }

      // Prepare the updated fields (Notice we don't update authorId or the original date)
      let updateData = {
        title,
        snippet: snippet || "",
        content,
        imageCaption: imageCaption || "",
        imageCredit: imageCredit || "",
        lastEditedBy: lastEditedBy || "Admin",
        lastUpdatedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      // Only update the image if the user uploaded a new file or pasted a new link
      if (req.file) {
        updateData.imageUrl = req.file.path; // New Cloudinary upload
      } else if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl; // Updates with a new link OR clears it if ""
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

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
