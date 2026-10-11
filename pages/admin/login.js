import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
//NEW IMPORTS
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "/firebase-client.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const messageDiv = document.getElementById("login-message");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const toggleIcon = document.getElementById("toggle-icon");

  togglePasswordBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.textContent = "visibility_off";
    } else {
      passwordInput.type = "password";
      toggleIcon.textContent = "visibility";
    }
  });

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      messageDiv.textContent = "Please fill in both email and password.";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      return;
    }

    if (!isValidEmail(email)) {
      messageDiv.textContent = "Please enter a valid email address.";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      return;
    }

    messageDiv.textContent = "Authenticating...";
    messageDiv.className =
      "mt-2 p-3 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

    try {
      // 2. Log them into Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      //NEW: Fetch their role and save it BEFORE redirecting
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        sessionStorage.setItem("currentUserId", user.uid);
        sessionStorage.setItem(
          "userRole",
          userData.isAdmin ? "admin" : "author",
        );
        sessionStorage.setItem("userName", userData.name);
      }

      messageDiv.textContent = "Success! Redirecting...";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

      setTimeout(() => {
        window.location.href = "/pages/admin/manage.html";
      }, 1000);
    } catch (error) {
      console.error("Login Error:", error);
      let errorMsg = "Invalid email or password.";
      if (error.code === "auth/too-many-requests") {
        errorMsg = "Too many failed attempts. Please try again later.";
      }
      messageDiv.textContent = errorMsg;
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
    }
  });
});
