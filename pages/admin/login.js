import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth } from "../../firebase-client.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const messageDiv = document.getElementById("login-message");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const togglePasswordBtn = document.getElementById("toggle-password");
  const toggleIcon = document.getElementById("toggle-icon");

  // --- 1. Password Visibility Toggle ---
  togglePasswordBtn.addEventListener("click", () => {
    // Check current type and swap it
    const currentType = passwordInput.getAttribute("type");
    const newType = currentType === "password" ? "text" : "password";
    passwordInput.setAttribute("type", newType);

    // Swap the icon
    toggleIcon.textContent =
      currentType === "password" ? "visibility_off" : "visibility";
  });

  // Basic Email Validator Function
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // --- 2. Form Submission & Validation ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Front-end Validation: Prevent empty submissions
    if (!email || !password) {
      messageDiv.textContent = "Please fill in both email and password.";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      return;
    }

    // Front-end Validation: Ensure correct email format
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
      // Send credentials to Firebase
      await signInWithEmailAndPassword(auth, email, password);

      messageDiv.textContent = "Success! Redirecting...";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

      setTimeout(() => {
        window.location.href = "/pages/admin/manage.html";
      }, 1000);
    } catch (error) {
      console.error("Login Error:", error);

      // Map Firebase error codes to user-friendly messages
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
