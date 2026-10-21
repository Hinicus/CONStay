import {
  createUserWithEmailAndPassword,
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
  const form = document.getElementById("signup-form");
  const messageDiv = document.getElementById("signup-message");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const togglePasswordBtn = document.getElementById("toggle-password");
  const toggleIcon = document.getElementById("toggle-icon");

  // Password Visibility Toggle
  togglePasswordBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.textContent = "visibility_off";
    } else {
      passwordInput.type = "password";
      toggleIcon.textContent = "visibility";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    messageDiv.textContent = "Creating account...";
    messageDiv.className =
      "mt-2 p-3 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Create their profile in Firestore as a "pending" regular author
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        isAdmin: false, // Regular author by default
        approvalStatus: "pending", // Requires manual admin approval
        dateCreated: serverTimestamp(),
      });

      // 3. Log them out immediately so they don't hit the auth-guard redirect loop
      await signOut(auth);

      messageDiv.textContent =
        "Application received! An admin must approve your account before you can log in.";
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

      form.reset();
    } catch (error) {
      console.error("Signup Error:", error);

      let errorMsg = "Failed to create account.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "An account with this email already exists.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters.";
      }

      messageDiv.textContent = errorMsg;
      messageDiv.className =
        "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
    }
  });

  // --- Google OAuth Registration / Login ---
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

        if (!userSnap.exists()) {
          // New applicant: Create pending profile using their Google name & email
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
            "Application received! An admin must approve your account before you can log in.";
          messageDiv.className =
            "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";
          return;
        }

        // Existing user: Check if they are already approved
        const userData = userSnap.data();
        if (userData.approvalStatus === "approved") {
          sessionStorage.setItem("currentUserId", user.uid);
          sessionStorage.setItem(
            "userRole",
            userData.isAdmin ? "admin" : "author",
          );
          sessionStorage.setItem("userName", userData.name);

          messageDiv.textContent = "Account already approved! Redirecting...";
          messageDiv.className =
            "mt-2 p-3 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

          setTimeout(() => {
            window.location.href = "/pages/admin/manage.html";
          }, 1000);
        } else {
          await signOut(auth);
          messageDiv.textContent = `An application for this Google account already exists (Status: ${userData.approvalStatus}).`;
          messageDiv.className =
            "mt-2 p-3 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";
        }
      } catch (error) {
        console.error("Google Signup Error:", error);
        if (error.code === "auth/popup-closed-by-user") {
          messageDiv.className = "hidden";
          return;
        }
        messageDiv.textContent = "Failed to sign up with Google.";
        messageDiv.className =
          "mt-2 p-3 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      }
    });
  }
});
