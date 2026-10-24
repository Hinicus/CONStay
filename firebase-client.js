// firebase-client.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALyPvVWLz257qpTjo5RdogAX3UnGlvN-M",
  authDomain: "constay-8841b.firebaseapp.com",
  projectId: "constay-8841b",
  storageBucket: "constay-8841b.firebasestorage.app",
  messagingSenderId: "201864426923",
  appId: "1:201864426923:web:81165a5c3f26875b270eee",
  measurementId: "G-BS546Q9BWX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

//Export the DB
export const db = getFirestore(app);
