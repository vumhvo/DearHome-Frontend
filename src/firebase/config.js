// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUspdRDcDJlEt6iiLmTVMkfGEYfsI4Xig",
  authDomain: "makemyhome-27df4.firebaseapp.com",
  projectId: "makemyhome-27df4",
  storageBucket: "makemyhome-27df4.appspot.com",
  messagingSenderId: "693946338720",
  appId: "1:693946338720:web:4bfb61a9ffc5b257c068c5",
  measurementId: "G-CYCEQPMWQE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(app);

export { app, storage };
