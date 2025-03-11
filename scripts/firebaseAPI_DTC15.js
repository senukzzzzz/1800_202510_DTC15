/**
 * Firebase Configuration and Initialization
 * This file contains the Firebase configuration object and initializes Firebase services
 * Required for authentication, database access, and other Firebase features
 */

// Firebase configuration object containing API keys and project settings
const firebaseConfig = {
    apiKey: "AIzaSyB3FDKJrWbLbMc-IZ0lux_5JJtZ4HB_Luo",
    authDomain: "comp1800-dtc15.firebaseapp.com",
    projectId: "comp1800-dtc15",
    storageBucket: "comp1800-dtc15.firebasestorage.app",
    messagingSenderId: "585853750092",
    appId: "1:585853750092:web:f551f55cd3bee7b1655de9"
};

/**
 * Firebase Initialization
 * 1. Initialize Firebase application with config
 * 2. Initialize Firestore database instance
 * These instances are used throughout the application for:
 * - User authentication (Firebase Auth)
 * - Data storage and retrieval (Firestore)
 */
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();