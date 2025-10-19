import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDeNgrFUdLTeXyErl3g01tOh1AkLE1aP5c",
  authDomain: "cleanup-af26e.firebaseapp.com",
  projectId: "cleanup-af26e",
  storageBucket: "cleanup-af26e.firebasestorage.app",
  messagingSenderId: "72304199163",
  appId: "1:72304199163:web:7f93b8f23062a0a3ba375e",
  measurementId: "G-0W0W1TTWNM"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export { auth, db, storage };