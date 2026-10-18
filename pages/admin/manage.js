import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, auth } from "/firebase-client.js";

// State variables for instant client-side filtering
let allArticles = [];
let currentArticleFilter = "all"; // "all" | "mine"
let currentSearchQuery = "";

let allAuthors = [];
let currentUserTab = "pending"; // "pending" | "approved" | "rejected"

document.addEventListener("DOMContentLoaded", () => {
  setupFilterListeners();
  fetchManageArticles();
});

function setupFilterListeners() {
  // 1. Article Search Input Listener
  const searchInput = document.getElementById("article-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderFilteredArticles();
    });
  }

  // 2. Article Ownership Filter Buttons ("All Articles" vs "My Articles")
  const filterBtns = document.querySelectorAll(".article-filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentArticleFilter = btn.getAttribute("data-article-filter");

      // Update active button styling
      filterBtns.forEach((b) => {
        b.className =
          "article-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-on-surface-variant hover:text-primary";
      });
      btn.className =
        "article-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-secondary text-white shadow-sm";

      renderFilteredArticles();
    });
  });

  // 3. Admin Author Directory Tabs ("Pending" | "Approved" | "Rejected")
  const userTabBtns = document.querySelectorAll(".user-tab-btn");
  userTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentUserTab = btn.getAttribute("data-user-tab");

      // Update active tab styling
      userTabBtns.forEach((b) => {
        b.className =
          "user-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-on-surface-variant hover:text-primary";
      });
      btn.className =
        "user-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-white shadow-sm";

      renderAuthorsByTab();
    });
  });
}

async function fetchManageArticles() {
  const listContainer = document.getElementById("articles-list");
  const userRole = sessionStorage.getItem("userRole") || "author";
  const userName = sessionStorage.getItem("userName") || "Contributor";

  // Greeting
  document.getElementById("user-greeting").textContent =
    `Logged in as ${userName} (${userRole.toUpperCase()})`;

  // Show the Admin Panel if the user is an admin
  if (userRole === "admin") {
    document.getElementById("admin-panel").classList.remove("hidden");
    fetchAllAuthors();
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/news?all=true`);
    allArticles = await response.json();
    renderFilteredArticles();
  } catch (error) {
    console.error("Error fetching articles:", error);
    listContainer.innerHTML = `<p class="text-[#ba1a1a] font-bold">Error loading articles.</p>`;
  }
}

function renderFilteredArticles() {
  const listContainer = document.getElementById("articles-list");
  const countBadge = document.getElementById("articles-count");
  const currentUserId = sessionStorage.getItem("currentUserId");
  const userRole = sessionStorage.getItem("userRole") || "author";

  // Filter by ownership ("all" vs "mine") and search query (title or authorName)
  const filtered = allArticles.filter((article) => {
    const status = article.status || "published";

    let matchesTab = true;
    if (currentArticleFilter === "mine") {
      matchesTab = article.authorId === currentUserId;
    } else if (currentArticleFilter === "drafts") {
      matchesTab = status === "draft";
    }

    const titleMatch = (article.title || "")
      .toLowerCase()
      .includes(currentSearchQuery);
    const authorMatch = (article.authorName || "")
      .toLowerCase()
      .includes(currentSearchQuery);

    return matchesTab && (titleMatch || authorMatch);
  });

  // Update counter badge
  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${allArticles.length} articles`;
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `<p class="text-on-surface-variant font-bold text-center py-8">No matching articles found.</p>`;
    return;
  }

  listContainer.innerHTML = filtered
    .map((article) => {
      const isOwner = article.authorId === currentUserId;
      const canEdit = userRole === "admin" || isOwner;
      const isDraft = article.status === "draft";

      const statusBadge = isDraft
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffddb3] text-[#291800] border border-[#e0b885]">Draft</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d7e2ff] text-[#021b3d]">Published</span>`;

      return `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-bright gap-4 hover:shadow-sm transition-shadow">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h3 class="font-title-sm text-title-sm text-primary">${article.title}</h3>${statusBadge}
            </div>
            <p class="text-xs text-on-surface-variant font-bold">Published: ${article.date} • By ${article.authorName}</p>
            ${
              article.lastEditedBy
                ? `<p class="text-[10px] text-on-surface-variant mt-1 italic">
                    Last updated by ${article.lastEditedBy} on ${article.lastUpdatedAt || "recently"}
                  </p>`
                : ""
            }
          </div>
          <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
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
}

// Global function to handle deletion
window.deleteArticle = async function (id) {
  const isConfirmed = confirm(
    "Are you sure you want to permanently delete this article? This cannot be undone.",
  );
  if (!isConfirmed) return;

  if (!auth.currentUser) {
    alert("Authentication error: Please refresh the page.");
    return;
  }
  const token = await auth.currentUser.getIdToken();

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/news/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
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

// --- Fetch & Manage All Authors (Admin Directory) ---
async function fetchAllAuthors() {
  const container = document.getElementById("pending-users-list");
  try {
    const snap = await getDocs(collection(db, "users"));

    // Filter out main Admin accounts so admins only manage regular authors
    allAuthors = snap.docs.map((d) => d.data()).filter((user) => !user.isAdmin);

    // Update tab counts
    const pendingCount = allAuthors.filter(
      (u) => u.approvalStatus === "pending",
    ).length;
    const approvedCount = allAuthors.filter(
      (u) => u.approvalStatus === "approved",
    ).length;
    const rejectedCount = allAuthors.filter(
      (u) => u.approvalStatus === "rejected",
    ).length;

    document.getElementById("count-pending").textContent = pendingCount;
    document.getElementById("count-approved").textContent = approvedCount;
    document.getElementById("count-rejected").textContent = rejectedCount;

    renderAuthorsByTab();
  } catch (error) {
    console.error("Error fetching users:", error);
    container.innerHTML = `<p class="text-sm text-[#ba1a1a] font-bold">Failed to load author directory.</p>`;
  }
}

function renderAuthorsByTab() {
  const container = document.getElementById("pending-users-list");
  const filteredUsers = allAuthors.filter(
    (user) => user.approvalStatus === currentUserTab,
  );

  if (filteredUsers.length === 0) {
    container.innerHTML = `<p class="text-sm text-on-surface-variant py-2">No ${currentUserTab} authors found.</p>`;
    return;
  }

  container.innerHTML = filteredUsers
    .map((user) => {
      let actionButtons = "";

      if (currentUserTab === "pending") {
        actionButtons = `
          <button onclick="approveUser('${user.uid}')" class="px-4 py-2 bg-[#438bc4] hover:bg-[#3472a5] text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
            Approve
          </button>
          <button onclick="rejectUser('${user.uid}')" class="px-4 py-2 bg-surface-container-high hover:bg-[#ba1a1a] hover:text-white text-on-surface-variant rounded-lg text-xs font-bold transition-colors border border-outline-variant hover:border-[#ba1a1a]">
            Reject
          </button>
        `;
      } else if (currentUserTab === "approved") {
        actionButtons = `
          <button onclick="rejectUser('${user.uid}')" class="px-4 py-2 bg-surface-container-high hover:bg-[#ba1a1a] hover:text-white text-on-surface-variant rounded-lg text-xs font-bold transition-colors border border-outline-variant hover:border-[#ba1a1a]">
            Revoke Access
          </button>
        `;
      } else if (currentUserTab === "rejected") {
        actionButtons = `
          <button onclick="approveUser('${user.uid}')" class="px-4 py-2 bg-[#438bc4] hover:bg-[#3472a5] text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
            Restore &amp; Approve
          </button>
        `;
      }

      return `
        <div class="flex items-center justify-between p-3 bg-surface-bright rounded-lg border border-outline-variant">
          <div>
            <p class="text-sm font-bold text-primary">${user.name}</p>
            <p class="text-xs text-on-surface-variant">${user.email}</p>
          </div>
          <div class="flex items-center gap-2">
            ${actionButtons}
          </div>
        </div>
      `;
    })
    .join("");
}

// --- Approve / Restore User ---
window.approveUser = async function (uid) {
  const isConfirmed = confirm("Grant this author access to publish articles?");
  if (!isConfirmed) return;

  try {
    await updateDoc(doc(db, "users", uid), {
      approvalStatus: "approved",
    });
    fetchAllAuthors();
  } catch (error) {
    console.error("Error approving user:", error);
    alert("Failed to approve user. Check console for details.");
  }
};

// --- Reject / Revoke User ---
window.rejectUser = async function (uid) {
  const isConfirmed = confirm(
    "Revoke or reject this author's access? They will not be able to sign in.",
  );
  if (!isConfirmed) return;

  try {
    await updateDoc(doc(db, "users", uid), {
      approvalStatus: "rejected",
    });
    fetchAllAuthors();
  } catch (error) {
    console.error("Error rejecting user:", error);
    alert("Failed to update user status.");
  }
};
