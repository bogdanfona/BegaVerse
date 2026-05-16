import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// YOUR Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBHf6H02ctVPa6HvfRfYcwhgxKTSePQTgw",
  authDomain: "begaverse-3d016.firebaseapp.com",
  projectId: "begaverse-3d016",
  storageBucket: "begaverse-3d016.firebasestorage.app",
  messagingSenderId: "659491433770",
  appId: "1:659491433770:web:ec14bd1a838f31f4840253",
  databaseURL: "https://begaverse-3d016-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;