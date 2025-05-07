import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebase';
import { logger } from '../Helpers/logger';
import { FirebaseDbService } from '../Helpers/firebase';

const auth = getAuth();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    console.error("Error signing in with Google: ", error.message);
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error signing in with email and password: ", error.message);
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
    } catch (error) {
      logger.error("Error logging out: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
  
      try {
        const tempDbService = new FirebaseDbService(user);
  
        // Try to fetch user role
        const userRole = await tempDbService.fetchRoleByUserId(user.uid);
  
        // Try to fetch avatar
        const userPhoto = await tempDbService.fetchAvatarPhotoByUserId(user.uid);
  
        const loggedInUser = {
          ...user,
          role: userRole,
          photoURL: userPhoto
        };
  
        setDbService(new FirebaseDbService(loggedInUser));
        setCurrentUser(loggedInUser);
        setLoading(false);
      } catch (err) {
        console.error("Error during post-auth user fetch:", err);

        // Flag for debugging if it's a permissions issue
        const isPermissionError =
          err?.code === "permission-denied" ||
          err?.message?.includes("Missing or insufficient permissions") ||
          err?.message?.includes("PERMISSION_DENIED");
      
        if (isPermissionError) {
          console.warn("Permission denied while accessing user data. User will be signed out.");
        } else {
          console.warn("Unexpected error during post-auth load. User will be signed out.");
        }
      
        // Always sign the user out on error
        await logout()
        setCurrentUser(null);
        setLoading(false);
      }
    });
  
    return () => unsubscribe();
  }, [auth]);
  

  return (
    <AuthContext.Provider value={{ currentUser, logout, dbService }}>
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
export const useAuth = () => useContext(AuthContext);
