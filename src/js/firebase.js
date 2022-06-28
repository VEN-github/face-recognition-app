// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXaOlwqCkdAVlV7ZPM-G9tph-WjCQxuzc",
  authDomain: "face-recognition-app-28d5a.firebaseapp.com",
  databaseURL:
    "https://face-recognition-app-28d5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "face-recognition-app-28d5a",
  storageBucket: "face-recognition-app-28d5a.appspot.com",
  messagingSenderId: "172377410285",
  appId: "1:172377410285:web:a55980fc1da4df67c89ae4",
  measurementId: "G-T927NP8YJ1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
