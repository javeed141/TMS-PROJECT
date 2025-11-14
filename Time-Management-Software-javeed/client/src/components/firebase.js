// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIchhqp3lMC1UMItniaG9riqczS0LPIgg",
  authDomain: "se-8b792.firebaseapp.com",
  projectId: "se-8b792",
  storageBucket: "se-8b792.firebasestorage.app",
  messagingSenderId: "479670622567",
  appId: "1:479670622567:web:d254280f666ced841877c2",
  measurementId: "G-XZQMSJQNGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db=getFirestore(app)
export const auth=getAuth()

export default app