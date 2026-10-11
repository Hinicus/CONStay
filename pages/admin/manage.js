//imports
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "/firebase-client.js";

document.addEventListener("DOMContentLoaded", fetchManageArticles);

async function fetchManageArticles() {
  const listContainer = document.getElementById("articles-list");
  const currentUserId = sessionStorage.getItem("currentUserId");
  const userRole = sessionStorage.getItem("userRole");

  // Show the Admin Panel if the user is an admin
  if (userRole === "admin") {
    document.getElementById("admin-panel").classList.remove("hidden");
    fetchPendingAuthors();
  }

  try {
    const response = await fetch("http://localhost:3000/api/news");
    const articles = await response.json();

    if (articles.length === 0) {
      listContainer.innerHTML = `<p class="text-on-surface-variant font-bold text-center py-8">No articles found. Time to write one!</p>`;
      return;
    }

    // Map over the articles and generate a styled row for each
    listContainer.innerHTML = articles
      .map((article) => {
        // Check permissions for this specific article
        const isOwner = article.authorId === currentUserId;
        const canEdit = userRole === "admin" || isOwner;

        return `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-bright gap-4 hover:shadow-sm transition-shadow">
          <div>
            <h3 class="font-title-sm text-title-sm text-primary mb-1">${article.title}</h3>
            <p class="text-xs text-on-surface-variant font-bold">Published: ${article.date} • By ${article.authorName}</p>
          </div>
          <div class="flex items-center gap-2">
            
            <a href="/pages/article/article.html?id=${article.id}" target="_blank" class="px-4 py-2 bg-surface-container-low border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-dim transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">visibility</span> View
            </a>

            ${
              canEdit
                ? `
              <a href="/pages/admin/edit.html?id=${article.id}" class="px-4 py-2 bg-surface-container-low border border-outline-variant text-primary rounded-lg text-xs font-bold hover:bg-surface-dim transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">edit</span> Edit
              </a>
              <button onclick="deleteArticle('${article.id}')" class="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-bold hover:bg-[#93000a] transition-colors flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
            `
                : `
              <span class="px-4 py-2 text-on-surface-variant text-xs font-bold bg-surface-container-lowest rounded-lg border border-transparent">
                View Only
              </span>
            `
            }
          </div>
        </div>
      `;
      })
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
    "Are you sure you want to permanently delete this article? This cannot be undone.",
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

// --- Fetch Pending Authors ---
async function fetchPendingAuthors() {
  const container = document.getElementById("pending-users-list");
  try {
    // Query Firestore for users who have approvalStatus == "pending"
    const q = query(
      collection(db, "users"),
      where("approvalStatus", "==", "pending"),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p class="text-sm text-on-surface-variant">No pending author applications.</p>`;
      return;
    }

    // Render the list of pending users with an Approve button
    container.innerHTML = snap.docs
      .map((doc) => {
        const user = doc.data();
        return `
        <div class="flex items-center justify-between p-3 bg-surface-bright rounded-lg border border-outline-variant">
          <div>
            <p class="text-sm font-bold text-primary">${user.name}</p>
            <p class="text-xs text-on-surface-variant">${user.email}</p>
          </div>
          <button onclick="approveUser('${user.uid}')" class="px-4 py-2 bg-secondary hover:bg-primary text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
            Approve
          </button>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching pending users:", error);
    container.innerHTML = `<p class="text-sm text-[#ba1a1a] font-bold">Failed to load pending users.</p>`;
  }
}

// --- Approve User ---
window.approveUser = async function (uid) {
  const isConfirmed = confirm(
    "Approve this author? They will immediately gain access to publish articles.",
  );
  if (!isConfirmed) return;

  try {
    // Update the user's document in Firestore
    await updateDoc(doc(db, "users", uid), {
      approvalStatus: "approved",
    });

    // Refresh the list so the user disappears from the pending UI
    fetchPendingAuthors();
  } catch (error) {
    console.error("Error approving user:", error);
    alert("Failed to approve user. Check console for details.");
  }
};
