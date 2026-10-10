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

    const imgEl = document.getElementById("article-image");
    imgEl.src = article.imageUrl || "https://via.placeholder.com/1200x600";
    imgEl.alt = article.title;

    const creditEl = document.getElementById("image-credit");
    if (article.imageCredit && article.imageCredit.trim() !== "") {
      creditEl.textContent = `Photo: ${article.imageCredit}`;
      creditEl.classList.remove("hidden"); // Reveal the element
    }

    // NEW: Handle optional Image Caption
    const captionContainer = document.getElementById("caption-container");
    const captionEl = document.getElementById("image-caption");
    if (article.imageCaption && article.imageCaption.trim() !== "") {
      captionEl.textContent = article.imageCaption;
      captionContainer.classList.remove("hidden"); // Reveal the container
    }

    // 4. Format the content into paragraphs (assuming it's saved as plain text)
    const contentContainer = document.getElementById("article-content");
    if (article.content) {
      // Split the text by line breaks and wrap each in a <p> tag
      const formattedContent = article.content
        .split("\n")
        .filter((paragraph) => paragraph.trim() !== "")
        .map(
          (paragraph) =>
            `<p class="text-xl sm:text-2xl font-serif text-[#12284b] leading-relaxed font-normal mb-8">${paragraph}</p>`,
        )
        .join("");

      contentContainer.innerHTML = formattedContent;
    } else {
      contentContainer.innerHTML = "<p>No content available.</p>";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("article-title").textContent =
      "Error loading the article.";
  }
}
