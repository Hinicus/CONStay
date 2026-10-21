import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
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

  // --- Google OAuth Login / Registration ---
  const googleAuthBtn = document.getElementById("google-auth-btn");
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      messageDiv.textContent = "Connecting to Google...";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // Case 1: Brand new user signing in with Google for the first time
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            isAdmin: false,
            approvalStatus: "pending",
            dateCreated: serverTimestamp(),
          });

          await signOut(auth);
          messageDiv.textContent =
            "Application received via Google! An admin must approve your account before you can log in.";
          messageDiv.className =
            "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";
          return;
        }

        // Case 2: Existing user in Firestore -> check approvalStatus
        const userData = userSnap.data();
        if (userData.approvalStatus !== "approved") {
          await signOut(auth);
          messageDiv.textContent = `Access denied. Your account status is: ${userData.approvalStatus}.`;
          messageDiv.className =
            "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
          return;
        }

        // Case 3: Approved Author or Admin -> Save session and redirect
        sessionStorage.setItem("currentUserId", user.uid);
        sessionStorage.setItem(
          "userRole",
          userData.isAdmin ? "admin" : "author",
        );
        sessionStorage.setItem("userName", userData.name);

        messageDiv.textContent = "Success! Redirecting...";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

        setTimeout(() => {
          window.location.href = "/pages/admin/manage.html";
        }, 1000);
      } catch (error) {
        console.error("Google Auth Error:", error);
        if (error.code === "auth/popup-closed-by-user") {
          messageDiv.className = "hidden";
          return;
        }
        messageDiv.textContent = "Google sign-in failed. Please try again.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      }
    });
  }

  // Forgot password
  const forgotPasswordBtn = document.getElementById("forgot-password-btn");

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();

      // 1. Ensure the user typed their email into the email box first
      if (!email) {
        messageDiv.textContent =
          "Please enter your email address in the email field first, then click 'Forgot Password?'.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        emailInput.focus();
        return;
      }

      if (!isValidEmail(email)) {
        messageDiv.textContent = "Please enter a valid email address.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        emailInput.focus();
        return;
      }

      messageDiv.textContent = "Sending password reset link...";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

      try {
        // 2. Trigger Firebase's password reset email
        await sendPasswordResetEmail(auth, email);

        messageDiv.textContent =
          "If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";
      } catch (error) {
        console.error("Password Reset Error:", error);
        let errorMsg = "Failed to send reset email. Please try again.";
        if (error.code === "auth/too-many-requests") {
          errorMsg =
            "Too many requests. Please wait a few minutes and try again.";
        }
        messageDiv.textContent = errorMsg;
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      }
    });
  }

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
      if (!userSnap.exists()) {
        await auth.signOut();
        messageDiv.textContent = "Error: User profile not found.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        return;
      }

      const userData = userSnap.data();
      if (userData.approvalStatus !== "approved") {
        await auth.signOut();
        messageDiv.textContent = `Access denied. Your account status is: ${userData.approvalStatus}.`;
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        return;
      }

      sessionStorage.setItem("currentUserId", user.uid);
      sessionStorage.setItem("userRole", userData.isAdmin ? "admin" : "author");
      sessionStorage.setItem("userName", userData.name);

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
