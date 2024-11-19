import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebase';

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

          // Include custom claims in the user object
          setCurrentUser({
            ...user,
            role: claims.role || 'parent-user', // Default to parent user if no role is set
          });
        } catch (error) {
          console.error("Error getting custom claims: ", error);
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
      console.log("Error logging out: ", error);
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
