import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firestore';
import { logger } from '../Helpers/logger';

const auth = getAuth();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    // Redirect to "/" if sign-in is successful
    window.location.href = "/profile";
  } catch (error) {
    console.error("Error signing in with Google: ", error.message);
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/profile";
  } catch (error) {
    console.error("Error signing in with email and password: ", error.message);
  }
};

// Create a context for the auth state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force token refresh to ensure latest claims
          const idTokenResult = await user.getIdTokenResult(true);
          const claims = idTokenResult.claims;
          logger.info('AuthProvider: fetched latest claims')

          // Fetch user data from Firestore
          const fetchWithRetry = async (maxRetries = 7, delay = 750) => {
            let attempts = 0;
            while (attempts < maxRetries) {
              try {
                logger.info(`AuthProvider: Attempting to fetch user data (attempt ${attempts + 1})`);
                const userDocRef = await getDoc(doc(db, 'Users', user.uid));
                const userDocData = userDocRef.data();

                return userDocData;
              } catch (error) {
                attempts++;
                logger.warn(`AuthProvider: Attempt ${attempts} failed:`, error);

                if (attempts >= maxRetries) {
                  throw new Error(`Failed to fetch user data after maximum ${attempts} attempts`);
                }

                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          }

          const userDocData = await fetchWithRetry();

          // Include custom claims in the user object
          setCurrentUser({
            ...user,
            role: claims.role || 'parent-user', // Default to parent user if no role is set
            photoURL: userDocData.PhotoURL || null,
          });
        } catch (error) {
          logger.error("Error getting custom claims: ", error);
        }
      } else {
        setCurrentUser(user);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, [auth]);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      logger.error("Error logging out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, logout }}>
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
