import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.firebase.authDomain,
  projectId: process.env.firebase.projectId,
  storageBucket: process.env.firebase.storageBucket,
  messagingSenderId: process.env.firebase.messagingSenderId,
  appId: process.env.firebase.appId,
  measurementId: process.env.firebase.measurementId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };

