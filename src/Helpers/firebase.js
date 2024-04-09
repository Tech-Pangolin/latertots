import { collection, getDocs, getDoc, where, query, arrayUnion, updateDoc, addDoc, doc } from "@firebase/firestore";
import { db } from "../config/firestore";

/**
 * Fetches the role of a user based on the provided role reference.
 * 
 * @param {Object} roleRef - The reference to the user's role.
 * @returns {Promise<string|null>} - A promise that resolves to the role ID if found, or null if not found.
 */
async function fetchUserRole(roleRef) {
  const roleSnapshot = await getDoc(roleRef);
  return roleSnapshot.exists() ? roleSnapshot.id : null;
}

/**
 * Fetches all users from the "Users" collection.
 * 
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects.
 */
export const fetchAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Users"));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    for (const user of users) {
      const roleRef = user.Role;
      user.Role = await fetchUserRole(roleRef);
    }
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Fetches the current user based on the provided email.
 * 
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object if found, or null if not found.
 * @throws {Error} - If there is an error fetching the current user.
 */
export const fetchCurrentUser = async (email) => {
  try {
    const q = query(collection(db, "Users"), where("Email", "==", email));
    const querySnapshot = await getDocs(q);
    const userDoc = querySnapshot.docs.find(doc => doc.data().Email === email);
    if (userDoc) {
      const user = { id: userDoc.id, ...userDoc.data() };
      const roleRef = user.Role;
      user.Role = await fetchUserRole(roleRef);
      return user;
    } else {
      throw new Error("No record found with email: " + email);
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

/**
 * Creates a document in the Children collection and associates it with the current user.
 * 
 * @param {string} userId - The ID of the current user.
 * @param {Object} childData - The data for the child document.
 * @returns {Promise<string>} - A promise that resolves to the ID of the created document.
 * @throws {Error} - If there is an error creating the document.
 */
export const createChildDocument = async (userId, childData) => {
  try {
    const docRef = await addDoc(collection(db, "Children"), childData);
    const userRef = doc(collection(db, "Users"), userId);
    await updateDoc(userRef, { Children: arrayUnion(docRef) });
    return docRef.id;
  } catch (error) {
    console.error("Error creating child document:", error);
    throw error;
  }
};

/**
 * Queries all the children associated with the current user.
 * 
 * @param {string} email - The email of the current user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of child objects associated with the current user.
 * @throws {Error} - If there is an error querying the children.
 */
export const fetchAllCurrentUsersChildren = async (email) => {
  try {
    const q = query(collection(db, "Users"), where("Email", "==", email));
    const querySnapshot = await getDocs(q);
    const userDoc = querySnapshot.docs.find(doc => doc.data().Email === email);
    if (userDoc) {
      const userRef = doc(collection(db, "Users"), userDoc.id);
      const userSnapshot = await getDoc(userRef);
      const childrenRefs = userSnapshot.data().Children;
      const childrenPromises = childrenRefs.map(childRef => getDoc(childRef));
      const childrenSnapshots = await Promise.all(childrenPromises);
      const children = childrenSnapshots.map(childSnapshot => ({ id: childSnapshot.id, ...childSnapshot.data() }));
      return children;
    } else {
      throw new Error("No record found with email: " + email);
    }
  } catch (error) {
    console.error("Error querying children:", error);
    throw error;
  }
};
