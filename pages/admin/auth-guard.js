import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth } from "/firebase-client.js";

// 1. Check Auth State
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // No user is logged in. Kick them out immediately.
    window.location.replace("/pages/admin/login.html");
  } else {
    // User is verified.
    // We can save their real Firebase UID to use as the authorId!
    sessionStorage.setItem("currentUserId", user.uid);
  }
});

// 2. Global Logout Functionality
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        // Once signed out, the onAuthStateChanged listener above
        // will automatically trigger and redirect them to login.
      } catch (error) {
        console.error("Error signing out:", error);
      }
    });
  }
});
