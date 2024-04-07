import * as firebaseui from 'firebaseui';
import { getAuth, EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

const uiConfig = {
  signInSuccessUrl: '/home', 
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID, 
    GoogleAuthProvider.PROVIDER_ID, 
  ],
};

// Initialize the FirebaseUI Widget using Firebase
const ui = new firebaseui.auth.AuthUI(auth);

export { ui, uiConfig};