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
    snapshot.forEach((doc) => {
      newsData.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(newsData);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
