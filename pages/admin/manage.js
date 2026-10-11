document.addEventListener("DOMContentLoaded", fetchManageArticles);

async function fetchManageArticles() {
  const listContainer = document.getElementById("articles-list");

  try {
    const response = await fetch("http://localhost:3000/api/news");
    const articles = await response.json();

    if (articles.length === 0) {
      listContainer.innerHTML = `<p class="text-on-surface-variant font-bold text-center py-8">No articles found. Time to write one!</p>`;
      return;
    }

    // Map over the articles and generate a styled row for each
    listContainer.innerHTML = articles
      .map(
        (article) => `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-bright gap-4 hover:shadow-sm transition-shadow">
        <div>
          <h3 class="font-title-sm text-title-sm text-primary mb-1">${article.title}</h3>
          <p class="text-xs text-on-surface-variant font-bold">Published: ${article.date} • By ${article.authorName}</p>
        </div>
        <div class="flex items-center gap-2">

            <!-- View Button -->
            <a href="/pages/article/article.html?id=${article.id}" target="_blank" class="px-4 py-2 bg-surface-container-low border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-dim transition-colors flex items-center gap-1">
             <span class="material-symbols-outlined text-[16px]">visibility</span> View
            </a>

          <!-- This links to the edit page by passing the ID in the URL -->
          <a href="/pages/admin/edit.html?id=${article.id}" class="px-4 py-2 bg-surface-container-low border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-dim transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">edit</span> Edit
          </a>
          <!-- Delete Button -->
          <button onclick="deleteArticle('${article.id}')" class="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-bold hover:bg-[#93000a] transition-colors flex items-center gap-1 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">delete</span> Delete
          </button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    console.error("Error fetching articles:", error);
    listContainer.innerHTML = `<p class="text-[#ba1a1a] font-bold">Error loading articles.</p>`;
  }
}

// Global function to handle deletion
window.deleteArticle = async function (id) {
  // 1. Ask for confirmation before deleting data
  const isConfirmed = confirm(
    "Are you sure you want to permanently delete this dispatch? This cannot be undone.",
  );
  if (!isConfirmed) return;

  try {
    // 2. Send the DELETE request to Express
    const response = await fetch(`http://localhost:3000/api/news/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // 3. Refresh the list to remove the deleted item from the screen
      fetchManageArticles();
    } else {
      const data = await response.json();
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to delete article:", error);
    alert("A network error occurred while trying to delete the article.");
  }
};
