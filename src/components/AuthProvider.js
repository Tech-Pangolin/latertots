import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebase';
import { logger } from '../Helpers/logger';
import { FirebaseDbService } from '../Helpers/firebase';
import { doc, DocumentReference, onSnapshot } from 'firebase/firestore';
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

// Create a context for the auth state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbService, setDbService] = useState(null);
  const auth = getAuth(app);

  const logout = async () => {
    try {
      await auth.signOut();
      setDbService(null);
      window.location.href = '/';
    } catch (error) {
      logger.error("Error logging out: ", error);
    }
  };

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

        // Subscribe to the user profile document
        // This will update the user profile in real-time from the Firestore
        unsubProfile = onSnapshot(userProfileDocRef, async (profileSnap) => {
          if (profileSnap.exists()) {
            const userProfileData = profileSnap.data();

            // Make sure every reference array is always an array
            userProfileData.Children = cleanupReferencesArray(userProfileData.Children);
            userProfileData.Contacts = cleanupReferencesArray(userProfileData.Contacts);
            userProfileData.Role = userProfileData.Role.path.split('/').pop();

            // Try to fetch avatar
            const userPhoto = await tempDbService.fetchAvatarPhotoByUserId(user.uid);

            // Update the user object with profile data
            loggedInUser = { ...user, ...userProfileData, photoURL: userPhoto };

            // Update the AuthProvider state
            setDbService(new FirebaseDbService(loggedInUser));
            setCurrentUser(loggedInUser);
            setLoading(false);

            logger.info("User profile loaded successfully:", loggedInUser);
          } else {
            logger.warn("User profile does not exist in Firestore.");
          }
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
  }, [auth]);


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