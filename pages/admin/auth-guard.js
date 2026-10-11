import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "/firebase-client.js";

// Authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/pages/admin/login.html");
    return;
  }

  try {
    // Fetch the user's profile from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert(
        "Error: User profile not found in database. Contact an administrator.",
      );
      await signOut(auth);
      return;
    }

    const userData = userSnap.data();

    // Check if they are allowed in
    if (userData.approvalStatus === "pending") {
      alert("Your account is currently pending approval by an admin.");
      await signOut(auth);
      return;
    }

    // Store their specific details for the UI to use
    sessionStorage.setItem("currentUserId", user.uid);
    sessionStorage.setItem("userRole", userData.isAdmin ? "admin" : "author");
    sessionStorage.setItem("userName", userData.name);
  } catch (error) {
    console.error("Auth Guard Error:", error);
    await signOut(auth);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    });
  }
});
