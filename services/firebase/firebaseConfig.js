// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth , getReactNativePersistence} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFFRJVuWpmEJI6NMOG55BpcgldNc6Lc_o",
  authDomain: "sprinterit.firebaseapp.com",
  projectId: "sprinterit",
  storageBucket: "sprinterit.firebasestorage.app",
  messagingSenderId: "380789040454",
  appId: "1:380789040454:web:cbd4c29e37678c00967147",
  measurementId: "G-MNJ4ZHZ1SF"
};



const app = initializeApp(firebaseConfig);

// Auth avec persistance locale
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);