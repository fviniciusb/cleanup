import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 1. Import getDatabase
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDeNgrFUdLTeXyErl3g01tOh1AkLE1aP5c", // Consider using environment variables for keys
  authDomain: "cleanup-af26e.firebaseapp.com",
  projectId: "cleanup-af26e",
  storageBucket: "cleanup-af26e.appspot.com", // Usually .appspot.com for storage
  messagingSenderId: "72304199163",
  appId: "1:72304199163:web:7f93b8f23062a0a3ba375e",
  measurementId: "G-0W0W1TTWNM",
  // 2. Make sure this URL is exactly as shown in your Firebase console
  databaseURL: "https://cleanup-af26e-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
// 3. Initialize rtdb
const rtdb = getDatabase(firebaseApp);

// 4. Export rtdb along with the others
export { auth, db, storage, rtdb };