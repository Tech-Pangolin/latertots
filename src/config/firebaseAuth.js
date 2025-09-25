import { app, useEmulator } from "./firebase";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseAuth = getAuth(app);

// Connect to Auth emulator if in emulator mode
if (useEmulator) {
  try {
    // Only connect if not already connected (prevents multiple connections)
    const hasEmulator = firebaseAuth.config.emulator;
    
    if (!hasEmulator) {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    }
  } catch (error) {
    // Connection might already exist, which is fine
    if (!error.message.includes('already been called')) {
      console.warn('Auth emulator connection warning:', error.message);
    }
  }
}

export { firebaseAuth };