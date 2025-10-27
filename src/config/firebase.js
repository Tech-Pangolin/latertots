// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, connectStorageEmulator } from "@firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Check if we should use emulator
const useEmulator = process.env.LATERTOTS_APP_USE_EMULATOR === 'true';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.LATERTOTS_APP_FIREBASE_API_KEY,
  authDomain: process.env.LATERTOTS_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.LATERTOTS_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.LATERTOTS_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.LATERTOTS_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.LATERTOTS_APP_FIREBASE_APP_ID,
  measurementId: process.env.LATERTOTS_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = useEmulator ? null : getAnalytics(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators if in emulator mode
if (useEmulator) {
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Connection might already exist, which is fine
    if (!error.message.includes('already been called')) {
      console.warn('Storage emulator connection warning:', error.message);
    }
  }
  
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // Connection might already exist, which is fine
    if (!error.message.includes('already been called')) {
      console.warn('Functions emulator connection warning:', error.message);
    }
  }
}

// export app, analytics, storage, functions, and emulator flag
export { app, analytics, storage, functions, useEmulator };