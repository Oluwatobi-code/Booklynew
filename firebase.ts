import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDgAj1Wiox7ExjstK8rmyAprr2ldJUxUuk",
    authDomain: "bookly-78b68.firebaseapp.com",
    projectId: "bookly-78b68",
    storageBucket: "bookly-78b68.firebasestorage.app",
    messagingSenderId: "332628564394",
    appId: "1:332628564394:web:092f1445af4bbea112f3d3",
    measurementId: "G-JJEB11WZR1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
