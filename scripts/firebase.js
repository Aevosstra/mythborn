import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVuHCEYHXIFCBWkrdYZPUJMbvRL-hz1u8",
  authDomain: "mythborn-49972.firebaseapp.com",
  projectId: "mythborn-49972",
  storageBucket: "mythborn-49972.firebasestorage.app",
  messagingSenderId: "459904051891",
  appId: "1:459904051891:web:e06047d479ac21c258dec6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);