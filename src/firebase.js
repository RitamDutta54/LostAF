import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5-wGL3iXYrIKrG7EL8L1G8orrU8nPTSU",
  authDomain: "lostaf-e6a77.firebaseapp.com",
  projectId: "lostaf-e6a77",
  storageBucket: "lostaf-e6a77.firebasestorage.app",
  messagingSenderId: "295012016895",
  appId: "1:295012016895:web:162844d3dcaee4f67162ca",
  measurementId: "G-RFJFB4QJRK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
