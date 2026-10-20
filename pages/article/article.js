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
    const response = await fetch(
      `${window.API_BASE_URL}/api/news/${articleId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch article data");

    const article = await response.json();

    // Edit the article page if you are an admin or author
    const ribbonEditBtn = document.getElementById("ribbon-edit-btn");
    const currentUserId = sessionStorage.getItem("currentUserId");
    const userRole = sessionStorage.getItem("userRole");
    if (
      ribbonEditBtn &&
      (userRole === "admin" || article.authorId === currentUserId)
    ) {
      ribbonEditBtn.classList.remove("hidden");
      ribbonEditBtn.classList.add("inline-flex");
    }

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
      imgEl.src = window.optimizeImageUrl
        ? window.optimizeImageUrl(article.imageUrl, 1400)
        : article.imageUrl;
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
      contentContainer.innerHTML = DOMPurify.sanitize(article.content, {
        USE_PROFILES: { html: true },
      });
    } else {
      contentContainer.innerHTML = "<p>No content available.</p>";
    }

    // Calculate and display estimated reading time (200 words per minute)
    const plainText = contentContainer.textContent || "";
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTimeEl = document.getElementById("article-read-time");
    if (readTimeEl) {
      readTimeEl.textContent = `${readTimeMinutes} min read`;
    }

    //Share / Copy Link button
    const shareBtn = document.getElementById("share-article-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareData = {
          title: `${article.title} - CONStay`,
          text: article.snippet || article.title,
          url: window.location.href,
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(window.location.href);
            const shareText = document.getElementById("share-text");
            const shareIcon = document.getElementById("share-icon");
            shareText.textContent = "Link Copied!";
            shareIcon.textContent = "check";
            setTimeout(() => {
              shareText.textContent = "Share";
              shareIcon.textContent = "share";
            }, 2000);
          }
        } catch (err) {
          console.log("Share canceled or failed:", err);
        }
      });
    }

    // 5. Load other news
    fetchOtherNews(articleId);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("article-title").textContent =
      "Error loading the article.";
  }
}

async function fetchOtherNews(currentArticleId) {
  const section = document.getElementById("other-news-section");
  const container = document.getElementById("other-news-container");

  try {
    // Fetch the first batch of recent news from Express
    const response = await fetch(`${window.API_BASE_URL}/api/news?page=1`);
    if (!response.ok) return;

    const articles = await response.json();

    // Filter out the article currently being read, and take up to 3 items
    const otherArticles = articles
      .filter((item) => item.id !== currentArticleId)
      .slice(0, 3);

    // If there are no other articles in the database yet, keep the section hidden
    if (otherArticles.length === 0) return;

    container.innerHTML = otherArticles
      .map(
        (item) => `
        <a href="/pages/article/article.html?id=${item.id}" 
           class="bg-white rounded-2xl border border-[#e0dac9] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1">
          ${
            item.imageUrl
              ? `<div class="aspect-[16/10] w-full overflow-hidden bg-slate-900">
                   <img loading="lazy" src="${window.optimizeImageUrl ? window.optimizeImageUrl(item.imageUrl, 600) : item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>`
              : ""
          }
          <div class="p-6 flex flex-col flex-1 justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                ${item.date}
              </span>
              <h3 class="serif-heading text-xl font-bold text-[#12284b] group-hover:text-[#0055a0] transition-colors mb-2 line-clamp-2">
                ${item.title}
              </h3>
              <p class="text-sm text-slate-600 line-clamp-3 mb-4">
                ${item.snippet || ""}
              </p>
            </div>
            <div class="pt-4 border-t border-[#e0dac9]/60 flex items-center justify-between mt-auto">
              <span class="text-xs font-bold text-[#12284b] flex items-center gap-1">
                <span class="material-symbols-outlined text-[#438bc4] text-sm">person</span>
                ${item.authorName}
              </span>
              <span class="material-symbols-outlined text-sm text-[#0055a0] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>
        </a>
      `,
      )
      .join("");

    // Reveal the section once cards are rendered
    section.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load other news:", error);
  }
}
