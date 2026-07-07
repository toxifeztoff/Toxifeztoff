import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_l7Ardlg4GvCHooUBAhnRK3olpovMpLc",
  authDomain: "toxifezt.firebaseapp.com",
  projectId: "toxifezt",
  storageBucket: "toxifezt.firebasestorage.app",
  messagingSenderId: "30101699985",
  appId: "1:30101699985:web:aabfe16d54f5c38f172e30"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
