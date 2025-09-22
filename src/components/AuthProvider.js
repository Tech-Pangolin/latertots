import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { app } from '../config/firebase';
import { logger } from '../Helpers/logger';
import { FirebaseDbService } from '../Helpers/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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

            // Use PhotoURL directly from the real-time data (eliminates redundant database call)
            const userPhoto = userProfileData.PhotoURL || null;

            // Update the user object with profile data
            loggedInUser = { ...user, ...userProfileData, PhotoURL: userPhoto };

            // Update the AuthProvider state
            setDbService(new FirebaseDbService(loggedInUser));
            setCurrentUser(loggedInUser);
            setLoading(false);

            // Redirect to profile page if this is a newly created profile
            if (profileJustCreated) {
              window.location.href = '/profile';
              setProfileJustCreated(false); // Reset the flag
            }
          } else {
            logger.warn("User.uid: ", user.uid, " profile does not exist in Firestore. Creating profile...");
            
            // Create user profile for new users (Google or email/password)
            try {
              await tempDbService.createUserProfileFromGoogleAuth(user);
              logger.info("User profile created successfully for:", user.uid);
              setProfileJustCreated(true);
              // The onSnapshot listener will pick up the newly created profile
            } catch (error) {
              logger.error("Failed to create user profile:", error);
              // Sign out user if profile creation fails
              await logout();
              setCurrentUser(null);
              setLoading(false);
            }
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