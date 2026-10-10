const express = require("express");
const cors = require("cors");

// 1. Use the new modular imports
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// 2. Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

// 3. Initialize Firestore
const db = getFirestore();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// GET endpoint to fetch news articles
app.get("/api/news", async (req, res) => {
  try {
    const newsRef = db.collection("news");
    // Order by date descending and limit to 4 to match your frontend design (1 featured + 3 list items)
    const snapshot = await newsRef.orderBy("date", "desc").limit(4).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No news articles found." });
    }

    let newsData = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const authorName = await getAuthorName(data.authorId);
      // Convert Firestore Timestamp to a standard JavaScript Date string
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
        date: formattedDate, // Override the raw timestamp with our formatted string
        authorName: authorName,
      });
    }

    res.status(200).json(newsData);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// GET endpoint to fetch a single news article by ID
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

    // Format the date
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

// Helper function to fetch an author's name
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
