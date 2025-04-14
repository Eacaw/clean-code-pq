import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

// Firebase configuration
// Note: This is embedded directly as per requirements
// In a production environment, these would typically be environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBknz5SIEg4aRMWAFBHDq3pEQUvmTYM-JA",
  authDomain: "dd25-cleancode.firebaseapp.com",
  projectId: "dd25-cleancode",
  storageBucket: "dd25-cleancode.firebasestorage.app",
  messagingSenderId: "587407301864",
  appId: "1:587407301864:web:e33bd4a320570b435dbd5d"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { app, db, auth, storage }
