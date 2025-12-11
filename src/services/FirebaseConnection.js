import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from 'firebase/functions';

// --- 1. MELHORIA DE SEGURANÇA (MUITO IMPORTANTE) ---
// Suas chaves NUNCA devem ficar visíveis no código.
// Elas devem ser lidas das Variáveis de Ambiente (arquivo .env).
// Crie um arquivo .env na raiz do seu projeto e cole suas chaves lá.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_DATABASE_URL
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const rtdb = getDatabase(firebaseApp);

// --- 2. CORREÇÃO DO BUG ---
// A variável se chama 'firebaseApp', e não 'app'.
const functions = getFunctions(firebaseApp);

// Export rtdb along with the others
export { auth, db, storage, rtdb, functions };