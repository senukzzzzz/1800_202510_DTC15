var firebaseConfig = {
    apiKey: "AIzaSyB3FDKJrWbLbMc-IZ0lux_5JJtZ4HB_Luo",
    authDomain: "comp1800-dtc15.firebaseapp.com",
    projectId: "comp1800-dtc15",
    storageBucket: "comp1800-dtc15.firebasestorage.app",
    messagingSenderId: "585853750092",
    appId: "1:585853750092:web:f551f55cd3bee7b1655de9"
  };
//--------------------------------------------
// initialize the Firebase app
// initialize Firestore database if using it
//--------------------------------------------
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();