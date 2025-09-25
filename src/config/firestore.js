import { app, useEmulator } from "./firebase";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const db = getFirestore(app);

// Connect to Firestore emulator if in emulator mode
if (useEmulator) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    if (!error.message.includes('already been called')) {
      console.warn('Firestore emulator connection warning:', error.message);
    }
  }
}

export { db };