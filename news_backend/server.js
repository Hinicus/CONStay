const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
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
// Notice how upload.single("imageFile") is here, allowing us to catch the file!
app.post("/api/news", upload.single("imageFile"), async (req, res) => {
  try {
    const {
      title,
      snippet,
      content,
      imageUrl,
      imageCaption,
      imageCredit,
      authorId,
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
    } else {
      return res
        .status(400)
        .json({ error: "Please provide an image file or an image link." });
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
});

// --- 2. GET Endpoint (All Articles for Dashboard) ---
app.get("/api/news", async (req, res) => {
  try {
    const newsRef = db.collection("news");
    const snapshot = await newsRef.orderBy("date", "desc").limit(4).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No news articles found." });
    }

    let newsData = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const authorName = await getAuthorName(data.authorId);

      const formattedDate = data.date
        ? data.date.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No date";

      newsData.push({
        id: doc.id,
        ...data,
        date: formattedDate,
        authorName: authorName,
      });
    }
    res.status(200).json(newsData);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// --- 3. GET Endpoint (Single Article) ---
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
