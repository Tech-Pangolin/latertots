import { app, useEmulator } from "./firebase";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseAuth = getAuth(app);
let authEmulatorConnected = false;

// Connect to Auth emulator if in emulator mode
if (useEmulator && !authEmulatorConnected) {
  try {
    connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    authEmulatorConnected = true;
  } catch (error) {
    // Connection might already exist, which is fine
    if (!error.message.includes('already been called')) {
      console.warn('Auth emulator connection warning:', error.message);
    } else {
      // If it's already connected, mark our flag as true
      authEmulatorConnected = true;
    }
  }
}

export { firebaseAuth };