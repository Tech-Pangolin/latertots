import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { app } from '../config/firebase';
import { logger } from '../Helpers/logger';
import { FirebaseDbService } from '../Helpers/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firestore';

const auth = getAuth();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    logger.error("Error signing in with Google: ", error.message);
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    logger.error("Error signing in with email and password: ", error.message);
  }
};

export const sendPasswordResetEmailToUser = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    logger.info('Password reset email sent successfully to:', email);
  } catch (error) {
    logger.error('Password reset request failed:', error.message);
    throw error;
  }
};

export const resetPasswordWithCode = async (code, newPassword) => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    logger.info('Password reset successfully');
  } catch (error) {
    logger.error('Password reset failed:', error.message);
    throw error;
  }
};

// Create a context for the auth state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbService, setDbService] = useState(null);
  const [profileJustCreated, setProfileJustCreated] = useState(false);
  const auth = getAuth(app);

  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      setDbService(null);
      setProfileJustCreated(false);
      window.location.href = '/';
    } catch (error) {
      logger.error("Error logging out: ", error);
    }
  }, [auth]);

  const cleanupReferencesArray = (children) => {
    // Ensure children is always an array
    if (!Array.isArray(children)) {
      if (children === undefined || children === null) {
        return [];
      }
      // If it's a single object, convert it to an array
      return [children];
    }
    // If it's already an array, filter out any nonstring or nonDocumentRef items
    // Since DocumentReference is a typescript type, I'm checking for path and id properties using js to avoid runtime js/ts errors
    return children.filter(child => typeof child === 'string' || (child && typeof child === 'object' && 'path' in child && 'id' in child));
  }

  const waitForUserProfile = async (userId, { maxRetries = 10, delayMs = 500 } = {}) => {
    const ref = doc(db, 'Users', userId);
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const snap = await getDoc(ref);
      if (snap.exists()) return snap; // success
      await new Promise(r => setTimeout(r, delayMs));
    }
    throw new Error('User profile document not found after maximum retries');
  };

  useEffect(() => {
    let unsubProfile = () => { }; // This will be used to unsubscribe from the profile listener
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      unsubProfile(); // Unsubscribe from any previous profile listener

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        let loggedInUser = null;
        const tempDbService = new FirebaseDbService(user);

        const userProfileDocRef = doc(db, 'Users', user.uid);

        // Wait until backend auth trigger creates the profile
        const initialSnap = await waitForUserProfile(user.uid, { maxRetries: 10, delayMs: 500 });

        // After the doc exists, attach realtime listener
        unsubProfile = onSnapshot(userProfileDocRef, async (profileSnap) => {
          if (!profileSnap.exists()) return; // rare edge case; ignore
          const userProfileData = profileSnap.data();
          userProfileData.Children = cleanupReferencesArray(userProfileData.Children);
          userProfileData.Contacts = cleanupReferencesArray(userProfileData.Contacts);
          userProfileData.Role = userProfileData.Role.path.split('/').pop();
          const userPhoto = userProfileData.PhotoURL || null;
          const loggedInUser = { ...user, ...userProfileData, PhotoURL: userPhoto };
          setDbService(new FirebaseDbService(loggedInUser));
          setCurrentUser(loggedInUser);
          setLoading(false);
        });

      } catch (err) {
        logger.error("Error during post-auth user fetch:", err);

        // Flag for debugging if it's a permissions issue
        const isPermissionError =
          err?.code === "permission-denied" ||
          err?.message?.includes("Missing or insufficient permissions") ||
          err?.message?.includes("PERMISSION_DENIED");

        if (isPermissionError) {
          logger.warn("Permission denied while accessing user data. User will be signed out.");
        } else {
          logger.warn("Unexpected error during post-auth load. User will be signed out.");
        }

        // Always sign the user out on error
        await logout()
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubProfile();
      unsubAuth();
    }
  }, [auth, logout]);


  return (
    <AuthContext.Provider value={{ currentUser, logout, dbService }}>
      {loading && (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the authentication context.
 * @function
 * @returns {Object} The authentication context.
 * @property {Object} currentUser - The current authenticated user.
 * @property {Function} logout - The function to log out the current user.
 */
export const useAuth = () => useContext(AuthContext)