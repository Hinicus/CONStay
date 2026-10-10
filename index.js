document.addEventListener("DOMContentLoaded", fetchNews);

async function fetchNews() {
  try {
    const response = await fetch("http://localhost:3000/api/news");
    if (!response.ok) throw new Error("Failed to fetch news");

    const newsData = await response.json();

    if (newsData && newsData.length > 0) {
      // First item becomes the featured article
      renderFeaturedNews(newsData[0]);

      // The rest (up to 3) become the list items
      if (newsData.length > 1) {
        renderNewsList(newsData.slice(1, 4));
      }
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("featured-news-container").innerHTML =
      "<p>Failed to load latest news.</p>";
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
              >person</span
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

function renderNewsList(articles) {
  const container = document.getElementById("news-list-container");
  let htmlString = "";

  articles.forEach((article) => {
    htmlString += `
      <article class="p-space-lg bg-surface-container-lowest rounded-DEFAULT shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
        <div class="flex items-center justify-between gap-space-sm mb-space-xxs">
          <span class="px-space-xs py-space-xxs rounded-full bg-secondary-fixed text-on-secondary-fixed font-caption text-caption uppercase">
            Update
          </span>
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

  container.innerHTML = htmlString;
}
