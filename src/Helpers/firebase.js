import { collection, getDocs, getDoc, where, query, arrayUnion, updateDoc, addDoc, doc, deleteDoc, Timestamp } from "@firebase/firestore";
import { db } from "../config/firestore";
import { ref, uploadBytes, getDownloadURL } from "@firebase/storage";
import { storage } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { logger } from "./logger";

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
    logger.error("Error fetching users:", error);
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
export const fetchCurrentUser = async (email, uid) => {
  const maxRetries = 10;
  try {
    let userDocRef;
    let userDoc;

    // Poll for the user document if the UID is provided
    if (uid) {
      logger.info("Polling for user document with UID:", uid);
      userDocRef = await pollForUserDocument(db, uid, maxRetries);
      userDoc = await getDoc(userDocRef);
    }

    // Poll for user document by email if not found by UID
    if (!userDoc || !userDoc.exists()) {
      logger.info("Querying for user document with email:", email);
      for (let i = 0; i < maxRetries; i++) {
        const q = query(collection(db, "Users"), where("Email", "==", email));
        const querySnapshot = await getDocs(q);
        const userDocSnapshot = querySnapshot.docs.find(doc => doc.data().Email === email);

        if (userDocSnapshot) {
          userDocRef = userDocSnapshot.ref;
          userDoc = userDocSnapshot;
          break;
        }

        logger.info(`User document not found with email, retrying... (${i + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, 1000 * i));
      }
    }

    if (userDoc && userDoc.exists()) {
      logger.info("User document found:", userDoc.data());
      const user = { id: userDoc.id, ...userDoc.data() };
      const roleRef = user.Role;
      if (roleRef) {
        logger.info("Fetching user role:", roleRef);
        user.Role = await fetchUserRole(roleRef);
      } else {
        logger.warn("Role reference not yet set.")
      }
      return user;
    } else {
      throw new Error("No record found with email: " + email);
    }
  } catch (error) {
    logger.error("Error fetching current user:", error);
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
 * Creates a document in the Contact collection and associates it with the current user.
 * 
 * @param {string} userId - The ID of the current user.
 * @param {Object} contactData - The data for the contact document.
 * @returns {Promise<string>} - A promise that resolves to the ID of the created document.
 * @throws {Error} - If there is an error creating the document.
 */
export const createContactDocument = async (userId, contactData) => {
  try {
    const docRef = await addDoc(collection(db, "Contacts"), contactData);
    const userRef = doc(collection(db, "Users"), userId);
    await updateDoc(userRef, { Contacts: arrayUnion(docRef) });
    return docRef.id;
  } catch (error) {
    console.error("Error creating contact document:", error);
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
      if (!childrenRefs) {
        return [];
      }
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

/**
 * Queries all the contacts associated with the current user.
 * 
 * @param {string} email - The email of the current user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of contact objects associated with the current user.
 * @throws {Error} - If there is an error querying the contacts.
 */
export const fetchAllCurrentUsersContacts = async (email) => {
  try {
    const q = query(collection(db, "Users"), where("Email", "==", email));
    const querySnapshot = await getDocs(q);
    const userDoc = querySnapshot.docs.find(doc => doc.data().Email === email);
    if (userDoc) {
      const userRef = doc(collection(db, "Users"), userDoc.id);
      const userSnapshot = await getDoc(userRef);
      const contactsRefs = userSnapshot.data().Contacts;
      if (!contactsRefs) {
        return [];
      }
      const contactsPromises = contactsRefs.map(contactRef => getDoc(contactRef));
      const contactsSnapshots = await Promise.all(contactsPromises);
      const contacts = contactsSnapshots.map(contactSnapshot => ({ id: contactSnapshot.id, ...contactSnapshot.data() }));
      return contacts;
    } else {
      throw new Error("No record found with email: " + email);
    }
  } catch (error) {
    console.error("Error querying contacts:", error);
   return []
  }
}

/**
 * Uploads a photo to Firebase Storage and associates it with the current user.
 * 
 * @param {string} userId - The ID of the current user.
 * @param {File} file - The photo file to upload.
 * @returns {Promise<string>} - A promise that resolves to the download URL of the uploaded photo.
 * @throws {Error} - If there is an error uploading the photo.
 */
export const uploadProfilePhoto = async (userId, file) => {
  try {
    if (!(file instanceof File)) {
      throw new Error(`Invalid file type: ${typeof file}. Please provide a valid File object.`);
    }

    // Create a storage reference with the user ID as the path
    const storageRef = ref(storage, `profile-photos/${userId}`);

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL of the uploaded photo
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Associate the photo with the current user
    const userRef = doc(collection(db, "Users"), userId);
    await updateDoc(userRef, { Photo: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading photo:", error);
  }
};

/**
 * Fetches all reservations where the User property reference matches the current User and the extendedProps.status property is either "pending" or "confirmed".
 * 
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of reservation objects.
 * @throws {Error} - If there is an error fetching the reservations.
 */
export const fetchUserReservations = async (userId) => {
  // Handle case when user ID is not yet available
  if (!userId) {
    return [];
  }

  try {
    const q = query(collection(db, "Reservations"),
      where("User", "==", doc(collection(db, "Users"), userId)) //,
      //where("extendedProps.status", "in", ["pending", "confirmed"])
    );
    const querySnapshot = await getDocs(q);
    const reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return reservations;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
};

/**
 * Checks if a new reservation overlaps with existing reservations and determines if it is allowable.
 * 
 * @param {Object} newReservation - The data for the new reservation.
 * @param {Date} newReservation.start - The start date of the new reservation.
 * @param {Date} newReservation.end - The end date of the new reservation.
 * @param {Array<Object>} unsavedEvents - An array of unsaved events from the client-side.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the allowability status and additional information.
 * @throws {Error} - If there is an error checking the reservation allowability.
 */
export function checkReservationAllowability(newReservation, unsavedEvents = []) {
  let overlappingEvents = [];
  unsavedEvents.forEach(event => {
    if (newReservation.id && event.id === newReservation.id) {
      return;
    }

    if (new Date(event.end) > new Date(newReservation.start) &&
        new Date(event.start) < new Date(newReservation.end)) {
      overlappingEvents.push(event);
    }
  });

  let times = [];
  overlappingEvents.forEach(event => {
    times.push({ time: new Date(event.start), type: 'start' });
    times.push({ time: new Date(event.end), type: 'end' });
  });

  times.sort((a, b) => a.time - b.time || (a.type === 'end' ? -1 : 1));

  let maxOverlap = 0;
  let currentOverlap = 0;
  times.forEach(time => {
    if (time.type === 'start') {
      currentOverlap++;
      maxOverlap = Math.max(maxOverlap, currentOverlap);
    } else {
      currentOverlap--;
    }
  });

  if ( maxOverlap < 5 ) {
    return { allow: true, size: maxOverlap };
  } else {
    return { allow: false, size: maxOverlap, message: "No more than 5 reservations are allowed at a time." };
  }
}


/**
 * Creates a document in the Reservations collection and associates it with the current user.
 * 
 * @param {string} userId - The ID of the current user.
 * @param {Object} reservationData - The data for the reservation document.
 * @returns {Promise<string>} - A promise that resolves to the ID of the created document.
 * @throws {Error} - If there is an error creating the document.
 */
export const createReservationDocument = async (userId, reservationData) => {
  try {
    const { id, ...dataWithoutId } = reservationData; // Remove the ID from the data. It's auto-generated by Firestore

    // Convert the start and end dates to Firestore Timestamps
    dataWithoutId.start = Timestamp.fromDate(new Date(dataWithoutId.start));
    dataWithoutId.end = Timestamp.fromDate(new Date(dataWithoutId.end));

    const docRef = await addDoc(collection(db, "Reservations"), dataWithoutId);
    const userRef = doc(collection(db, "Users"), userId);

    // Add a reference to the user document
    await updateDoc(docRef, { User: userRef });

    // Add a reference to the child document
    const childRef = doc(collection(db, "Children"), reservationData.extendedProps.childId);
    await updateDoc(docRef, { Child: childRef });

    return docRef.id;
  } catch (error) {
    console.error("Error creating reservation document:", error);
    throw error;
  }
};

/**
 * Updates a reservation document in the Reservations collection.
 * 
 * @param {string} userId - The ID of the current user.
 * @param {Object} reservationData - The updated data for the reservation document.
 * @returns {Promise<void>} - A promise that resolves when the document is successfully updated.
 * @throws {Error} - If there is an error updating the document.
 */
export const updateReservationDocument = async (reservationData) => {
  try {
    const { id, ...dataWithoutId } = reservationData; // Remove the ID from the data

    // Convert the start and end dates to Firestore Timestamps
    dataWithoutId.start = Timestamp.fromDate(new Date(dataWithoutId.start));
    dataWithoutId.end = Timestamp.fromDate(new Date(dataWithoutId.end));

    const reservationRef = doc(collection(db, "Reservations"), id);
    await updateDoc(reservationRef, { ...dataWithoutId });
  } catch (error) {
    console.error("Error updating reservation document:", error);
    throw error;
  }
};

/**
 * Deletes a reservation document from the Reservations collection.
 * 
 * @param {string} reservationId - The ID of the reservation document to delete.
 * @returns {Promise<void>} - A promise that resolves when the document is successfully deleted.
 * @returns {null} - If the reservation document does not exist.
 * @throws {Error} - If there is an error deleting the document.
 */
export const deleteReservationDocument = async (reservationId) => {
  try {
    const reservationRef = doc(collection(db, "Reservations"), reservationId);
    const reservationSnapshot = await getDoc(reservationRef);
    if (!reservationSnapshot.exists()) {
      return null;
    }

    const status = reservationSnapshot.data().extendedProps.status;
    if (status === 'pending' || status === 'confirmed') {
      await deleteDoc(reservationRef);
    } else {
      throw new Error("Cannot delete reservation with status: " + status);
    }
  } catch (error) {
    console.error("Error deleting reservation document:", error);
    throw error;
  }
};


/**
 * Creates a new user and authenticates using the provided email and password.
 * 
 * @param {Object} firebaseAuth - The Firebase authentication object.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<User>} A promise that resolves to the authenticated user object.
 */
export const createUserAndAuthenticate = async (firebaseAuth, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return userCredential.user;
};


/**
 * Polls for the existence of a user document in the Firebase Firestore database.
 * 
 * @param {import('firebase/firestore').Firestore} db - The Firestore database instance.
 * @param {string} userId - The ID of the user document to poll for.
 * @param {number} [retries=10] - The maximum number of retries to poll for the user document.
 * @returns {Promise<import('firebase/firestore').DocumentReference>} - A promise that resolves to the user document reference if found.
 * @throws {Error} - Throws an error if the user document is not found after the maximum retries.
 */
export const pollForUserDocument = async (db, userId, retries = 10) => {
  let userDocRef;
  for (let i = 0; i < retries; i++) {
      userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          return userDocRef;
      }
      console.log(`User document not found, retrying... (${i + 1}/10)`);
      await new Promise(r => setTimeout(r, 1000 * i));
  }
  throw new Error('User document not found after maximum retries.');
};