import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBf2TU-m_OwHGfZbVH4hiF_8pWWsJep89I",
  authDomain: "la-manada-app.firebaseapp.com",
  projectId: "la-manada-app",
  storageBucket: "la-manada-app.firebasestorage.app",
  messagingSenderId: "802190933986",
  appId: "1:802190933986:web:5138b0fd6ba5782ac883bb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);