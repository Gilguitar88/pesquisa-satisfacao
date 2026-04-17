import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6kuZAFk2agDC_KiTKeWPjPsHgBa0CdAY",
  authDomain: "clinica-mazon-bigliazzi.firebaseapp.com",
  projectId: "clinica-mazon-bigliazzi",
  storageBucket: "clinica-mazon-bigliazzi.firebasestorage.app",
  messagingSenderId: "884155809710",
  appId: "1:884155809710:web:00d72a3b1988dcbdded23f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
