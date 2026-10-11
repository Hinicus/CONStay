let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  // Load the first page immediately
  fetchNews(currentPage);

  // Hook up the Load More button
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPage++;
      fetchNews(currentPage);
    });
  }
});

async function fetchNews(page = 1) {
  const loadMoreBtn = document.getElementById("load-more-btn");

  // Show a loading spinner on the button if clicking "Load More"
  if (loadMoreBtn && page > 1) {
    loadMoreBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Loading...`;
  }

  try {
    // 1. Fetch the specific page from Express
    const response = await fetch(`http://localhost:3000/api/news?page=${page}`);
    if (!response.ok) throw new Error("Failed to fetch news");

    const newsData = await response.json();

    if (page === 1) {
      // PAGE 1 LOGIC: Split between Featured (1st) and List (the rest)
      if (newsData && newsData.length > 0) {
        renderFeaturedNews(newsData[0]);

        if (newsData.length > 1) {
          // Pass 'true' to completely replace the container's HTML
          renderNewsList(newsData.slice(1), true);
        } else {
          document.getElementById("news-list-container").innerHTML = "";
        }
      } else {
        document.getElementById("featured-news-container").innerHTML =
          "<p class='p-space-xl'>No dispatches published yet.</p>";
        document.getElementById("news-list-container").innerHTML = "";
      }
    } else {
      // PAGE 2+ LOGIC: Everything goes straight to the list
      if (newsData && newsData.length > 0) {
        // Pass 'false' to append the new articles to the bottom
        renderNewsList(newsData, false);
      }
    }

    // 2. Button Visibility Logic (Assuming limitCount = 6 in Express)
    if (newsData.length < 6) {
      // Reached the end of the database
      if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    } else {
      // More articles likely exist
      if (loadMoreBtn) {
        loadMoreBtn.classList.remove("hidden");
        loadMoreBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">expand_more</span> Load More Articles`;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    if (page === 1) {
      document.getElementById("featured-news-container").innerHTML =
        "<p>Failed to load latest news.</p>";
    }
  }
}

function renderFeaturedNews(article) {
  const container = document.getElementById("featured-news-container");
  container.innerHTML = `
    <div class="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col">
      <div class="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
             src="${article.imageUrl || "https://via.placeholder.com/800x500"}" alt="${article.title}" />
      </div>
      <div class="p-space-xl flex flex-col justify-between flex-grow">
        <div>
          <div class="flex items-center gap-space-sm text-on-surface-variant font-caption text-caption uppercase tracking-wider mb-space-xs">
            <span>${article.date}</span>
          </div>
          <h3 class="font-headline-md text-headline-md text-primary mb-space-sm group-hover:text-secondary transition-colors">
            ${article.title}
          </h3>
          <p class="font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-space-lg">
            ${article.snippet}
          </p>
        </div>
        <div class="flex items-center justify-between pt-space-md border-t border-surface-container-low mt-auto">
            <div class="flex items-center gap-1">
            <span class="material-symbols-outlined text-clear-skies text-md"
              >person</span>
            <span class="font-label-sm text-label-sm text-primary">${article.authorName}</span>
            </div>
          <a class="inline-flex items-center gap-space-xs font-label-md text-label-md text-secondary hover:text-primary" href="/pages/article/article.html?id=${article.id}">
            <span>Read Full Story</span>
            <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// (Updated to accept the 'replace' parameter for pagination)
function renderNewsList(articles, replace = true) {
  const container = document.getElementById("news-list-container");
  let htmlString = "";

  articles.forEach((article) => {
    htmlString += `
      <article class="p-space-lg bg-surface-container-lowest rounded-DEFAULT shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
        <div class="flex flex-row-reverse items-center justify-between gap-space-sm mb-space-xxs">
          <span class="font-caption text-caption text-on-surface-variant">${article.date}</span>
        </div>
        <h4 class="font-title-md text-title-md text-primary group-hover:text-secondary transition-colors mb-space-xs">
          ${article.title}
        </h4>
        <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-sm">
          ${article.snippet}
        </p>
        <a class="inline-flex items-center gap-space-xxs font-label-sm text-label-sm text-secondary hover:text-primary mt-auto" href="/pages/article/article.html?id=${article.id}">
          <span>Continue reading</span>
          <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
        </a>
      </article>
    `;
  });

  // If page 1, overwrite the container. If page 2+, append it!
  if (replace) {
    container.innerHTML = htmlString;
  } else {
    container.insertAdjacentHTML("beforeend", htmlString);
  }
}
