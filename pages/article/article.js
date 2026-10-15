document.addEventListener("DOMContentLoaded", fetchSingleArticle);

async function fetchSingleArticle() {
  // 1. Grab the ID from the URL string
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  if (!articleId) {
    document.getElementById("article-title").textContent =
      "Article not found (Missing ID).";
    return;
  }

  try {
    // 2. Fetch the specific article from Express
    const response = await fetch(`http://localhost:3000/api/news/${articleId}`);
    if (!response.ok) throw new Error("Failed to fetch article data");

    const article = await response.json();

    // 3. Update the page title and HTML elements
    document.title = `${article.title} - CONStay`;
    document.getElementById("article-title").textContent = article.title;
    document.getElementById("article-date").textContent = article.date;
    document.getElementById("article-author").textContent = article.authorName;

    // Check for edit history
    const editContainer = document.getElementById("article-edit-container");
    const editHistory = document.getElementById("article-edit-history");

    if (article.lastEditedBy) {
      editContainer.classList.remove("hidden");
      editContainer.classList.add("flex");
      editHistory.textContent = `Updated by ${article.lastEditedBy} on ${article.lastUpdatedAt}`;
    }

    const imgEl = document.getElementById("article-image");
    if (article.imageUrl) {
      // If an image exists, set the source and alt text
      imgEl.src = article.imageUrl;
      imgEl.alt = article.title;
    } else {
      // If there is no image, find the parent <figure> tag and hide it
      imgEl.closest("figure").classList.add("hidden");
    }

    const creditEl = document.getElementById("image-credit");
    if (article.imageCredit && article.imageCredit.trim() !== "") {
      creditEl.textContent = `Photo: ${article.imageCredit}`;
      creditEl.classList.remove("hidden"); // Reveal the element
    }

    // Handle optional Image Caption
    const captionContainer = document.getElementById("caption-container");
    const captionEl = document.getElementById("image-caption");
    if (article.imageCaption && article.imageCaption.trim() !== "") {
      captionEl.textContent = article.imageCaption;
      captionContainer.classList.remove("hidden");
      captionContainer.classList.add("flex");
    }

    // 4. Format the content
    const contentContainer = document.getElementById("article-content");
    if (article.content) {
      contentContainer.innerHTML = article.content;
    } else {
      contentContainer.innerHTML = "<p>No content available.</p>";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("article-title").textContent =
      "Error loading the article.";
  }
}
