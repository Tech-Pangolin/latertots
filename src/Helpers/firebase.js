import { collection, getDocs, getDoc, where, query, arrayUnion, updateDoc, addDoc, doc, setDoc, deleteDoc, Timestamp, onSnapshot } from "@firebase/firestore";
import { db } from "../config/firestore";
import { ref, uploadBytes, getDownloadURL } from "@firebase/storage";
import { storage } from "../config/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { logger } from "./logger";
import { IMAGE_UPLOAD } from "./constants";
import ReservationSchema from "../schemas/ReservationSchema.mjs";


export class FirebaseDbService {
  constructor(userContext) {
    this.userContext = userContext;
  }


  /**
   * Fetches the avatar photo URL of a user based on the provided user ID.
   * 
   * @param {string} userId - The ID of the user to fetch the avatar photo for.
   * @returns {Promise<string|null>} - A promise that resolves to the avatar photo URL if found, or null if not found.
   */
  async fetchAvatarPhotoByUserId(userId) {
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().PhotoURL || null;
    }
    return null;
  }

  validateAuth(requiredRole = null) {
    if (!this.userContext || !this.userContext.uid) {
      throw new Error("Authentication required.");
    }

    if (requiredRole && this.userContext.Role !== requiredRole) {
      throw new Error("Unauthorized access.");
    }
  }

  #mapSnapshotToData(snapshot) {
    try {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error("Error mapping snapshot to data:", error);
    }
  }

  /**
   * Fetches documents from a Firestore collection reference.
   *  
   * @param {import('firebase/firestore').CollectionReference} ref - The Firestore collection reference to fetch documents from.
   * @param {boolean} [adminOnly=false] - If true, only allows access for admin users.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of document data objects.
   * @throws {Error} - If the user is not authenticated or does not have the required role.
   */
  async fetchDocs(ref, adminOnly = false) {
    if (adminOnly) {
      this.validateAuth('admin');
    } else {
      this.validateAuth();
    }
    const data = await getDocs(ref).then(snapshot => this.#mapSnapshotToData(snapshot))
    return data;
  }

  /**
   * Subscribes to real-time updates of documents in a Firestore collection reference.
   * 
   * @param {import('firebase/firestore').CollectionReference} ref - The Firestore collection reference to subscribe to.
   * @param {function} callback - The callback function to execute when documents change.
   * @param {boolean} [adminOnly=false] - If true, only allows access for admin users.
   * @returns {function} - A function to unsubscribe from the real-time updates.
   * @throws {Error} - If the user is not authenticated or does not have the required role.
   */
  subscribeDocs(ref, callback, adminOnly = false) {
    if (adminOnly) {
      this.validateAuth('admin');
    } else {
      this.validateAuth();
    }
    return onSnapshot(ref, (snapshot) => {
      try {
        callback(this.#mapSnapshotToData(snapshot));
      } catch (error) {
        logger.error("Error subscribing to documents:", error);
      }
    });
  }

  /**
   * Creates a document in the Children collection and associates it with the current user.
   * 
   * @param {string} userId - The ID of the current user.
   * @param {Object} childData - The data for the child document.
   * @returns {Promise<string>} - A promise that resolves to the ID of the created document.
   * @throws {Error} - If there is an error creating the document.
   */
  async createChildDocument(childData) {
    this.validateAuth();
    try {
      const docRef = await addDoc(collection(db, "Children"), childData);
      const userRef = doc(collection(db, "Users"), this.userContext.uid);
      await updateDoc(userRef, { Children: arrayUnion(docRef) });
      return docRef.id;
    } catch (error) {
      logger.error("Error creating child document:", error);
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
  createContactDocument = async (contactData) => {
    this.validateAuth();
    contactData.archived = false;
    try {
      const docRef = await addDoc(collection(db, "Contacts"), contactData);
      const userRef = doc(collection(db, "Users"), this.userContext.uid);
      await updateDoc(userRef, { Contacts: arrayUnion(docRef) });
      return docRef.id;
    } catch (error) {
      logger.error("Error creating contact document:", error);
      throw error;
    }
  };


  /**
   * Queries all users and their associated children.
   * 
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects, each containing their associated children.
   * @throws {Error} - If there is an error querying the users.
   */
  getUsersWithChildren = async () => {
    const usersRef = collection(db, "Users");
    const usersSnap = await getDocs(usersRef);

    const results = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const childIds = userData.Children || []; // Array of child IDs

      let childrenData = [];
      if (childIds.length > 0) {
        // Firestore where('id', 'in', [...]) only supports up to 10 IDs per query
        const childrenRef = collection(db, "Children");
        const childrenQuery = query(childrenRef, where("__name__", "in", childIds.slice(0, 10)));
        const childrenSnap = await getDocs(childrenQuery);

        childrenData = childrenSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      results.push({
        id: userDoc.id,
        ...userData,
        children: childrenData,
      });
    }

    return results;
  }
  /**
    * Queries all children and their associated parents(users).
    * 
    * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects, each containing their associated children.
    * @throws {Error} - If there is an error querying the users.
    */
  getChildrenWithParents = async () => {
    const childrenRef = collection(db, "Children");
    const childrenSnap = await getDocs(childrenRef);

    const results = [];

    for (const childDoc of childrenSnap.docs) {
      const childData = childDoc.data();
      const parentId = childData.parentId; // <-- recommended field

      let parentData = null;
      if (parentId) {
        const parentSnap = await getDoc(doc(db, "Users", parentId));
        if (parentSnap.exists()) {
          parentData = { id: parentSnap.id, ...parentSnap.data() };
        }
      }

      results.push({
        id: childDoc.id,
        ...childData,
        parent: parentData,
      });
    }

    return results;
  }

  /**
   * Queries all the children associated with the current user.
   * 
   * @param {string} email - The email of the current user.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of child objects associated with the current user.
   * @throws {Error} - If there is an error querying the children.
   */
  fetchAllCurrentUsersChildren = async () => {
    this.validateAuth();
    try {
      const q = query(collection(db, "Users"), where("Email", "==", this.userContext.email), where("archived", "==", false));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs.find(doc => doc.data().Email === this.userContext.email);
      if (userDoc) {
        const userRef = doc(collection(db, "Users"), userDoc.id);
        const userSnapshot = await getDoc(userRef);
        let childrenRefs = userSnapshot.data().Children;
        if (!childrenRefs) {
          return [];
        } else if (!Array.isArray(childrenRefs)) {
          // This happens when there's only one child and the data is not an array
          childrenRefs = [childrenRefs];
        }
        const childrenPromises = childrenRefs.map(async (childRef) => {
          try {
            return await getDoc(childRef);
          } catch (error) {
            logger.error(`Error querying child: ${childRef.path}`, error);
            throw error;
          }
        });

        const childrenSnapshots = await Promise.all(childrenPromises);
        const children = childrenSnapshots.map(childSnapshot => ({ id: childSnapshot.id, ...childSnapshot.data() }));
        return children;
      } else {
        throw new Error("No record found with email: " + this.userContext.email);
      }
    } catch (error) {
      logger.error("Error querying children:", error);
      throw error;
    }
  };
  /**
   * Queries all the children associated with the current user.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects.
   * @throws {Error} - If there is an error querying the users.
   */
  fetchAllCurrentUsers = async () => {
    this.validateAuth();
    try {
      const q = query(collection(db, "Users"), where("archived", "==", false));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (users) {
        return users;
      } else {
        throw new Error("No Users found");
      }
    } catch (error) {
      logger.error("Error querying users:", error);
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
  fetchAllCurrentUsersContacts = async (email) => {
    this.validateAuth();
    try {
      const q = query(collection(db, "Users"), where("Email", "==", email), where("archived", "==", false));
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
      logger.error("Error querying contacts:", error);
      return []
    }
  }

  /**
   * Uploads a photo to Firebase Storage with dynamic entity type and ID.
   * 
   * @param {string} entityType - The type of entity (e.g., 'profile', 'child')
   * @param {string} entityId - The ID of the entity
   * @param {File} file - The photo file to upload.
   * @returns {Promise<string>} - A promise that resolves to the download URL of the uploaded photo.
   * @throws {Error} - If there is an error uploading the photo.
   */
  uploadPhoto = async (entityType, entityId, file) => {
    this.validateAuth();
    try {
      if (!(file instanceof File)) {
        throw new Error(`Invalid file type: ${typeof file}. Please provide a valid File object.`);
      }

      // Security validation: Check file type and size
      if (!IMAGE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP images are allowed.`);
      }

      if (file.size > IMAGE_UPLOAD.MAX_IMAGE_SIZE_BYTES) {
        throw new Error(`File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed size is 5MB.`);
      }

      // Create a storage reference with dynamic path based on entity type
      const storageRef = ref(storage, `${entityType}-photos/${entityId}`);

      // Upload the file with custom metadata for security
      const metadata = {
        customMetadata: {
          owner: this.userContext.uid,
          entityType: entityType,
          entityId: entityId
        }
      };
      const snapshot = await uploadBytes(storageRef, file, metadata);

      // Get the download URL of the uploaded photo
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      logger.error("Error uploading photo:", error);
      // Re-throw the error so it can be handled by the calling code
      throw error;
    }
  };

  /**
   * Uploads a profile photo to Firebase Storage, referencing the current user.
   * 
   * @param {string} userId - The ID of the current user.
   * @param {File} file - The photo file to upload.
   * @returns {Promise<string>} - A promise that resolves to the download URL of the uploaded photo.
   * @throws {Error} - If there is an error uploading the photo.
   */
  uploadProfilePhoto = async (userId, file) => {
    return this.uploadPhoto('profile', userId, file);
  };

  /**
   * Uploads a child photo to Firebase Storage.
   * 
   * @param {string} childId - The ID of the child.
   * @param {File} file - The photo file to upload.
   * @returns {Promise<string>} - A promise that resolves to the download URL of the uploaded photo.
   * @throws {Error} - If there is an error uploading the photo.
   */
  uploadChildPhoto = async (childId, file) => {
    return this.uploadPhoto('child', childId, file);
  };

  /**
   * Fetches all reservations where the User property reference matches the current User and the extendedProps.status property is either "pending" or "confirmed".
   * 
   * @param {string} userId - The ID of the current user.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of reservation objects.
   * @throws {Error} - If there is an error fetching the reservations.
   */
  fetchUserReservations = async (userId) => {
    this.validateAuth();
    // Handle case when user ID is not yet available
    if (!userId) {
      return [];
    }

    try {
      const q = query(collection(db, "Reservations"),
        where("User", "==", doc(collection(db, "Users"), userId)),
        where("archived", "!=", true) //,
        //where("extendedProps.status", "in", ["pending", "confirmed"])
      );
      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reservations;
    } catch (error) {
      logger.error("Error fetching reservations:", error);
      throw error;
    }
  };

  /**
   * Fetches all reservations from the Reservations collection by month and optional day.
   * 
   * @param {number} year - The year to fetch reservations for.
   * @param {number} monthNumber - The month number to fetch reservations for.
   * @param {number} [dayNumber=null] - The day number to fetch reservations for.
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of reservation objects.
   * @throws {Error} - If there is an error fetching the reservations.
   */
  fetchAllReservationsByMonthDay = async (year, monthNumber, dayNumber = null) => {
    this.validateAuth("admin");
    // 'start' property is a Firestore Timestamp
    try {
      let q, dateStart, dateEnd;
      const collectionRef = collection(db, "Reservations");

      if (dayNumber) {
        // Fetch reservations for a specific day
        dateStart = new Date(year, monthNumber, dayNumber);
        dateEnd = new Date(year, monthNumber, dayNumber + 1);
      } else {
        // Fetch reservations for the entire month
        dateStart = new Date(year, monthNumber, 1);
        dateEnd = new Date(year, monthNumber + 1, 1);
      }

      q = query(collectionRef,
        where("start", ">=", dateStart),
        where("start", "<", dateEnd),
        where("archived", "!=", true)
      );

      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reservations;
    } catch (error) {
      logger.error("Error fetching reservations:", error);
      throw error;
    }
  };


  /**
   * Checks if a new reservation overlaps with existing reservations and determines if it is allowable.
   * 
   * @param {Object} newReservation - The data for the new reservation.
   * @param {Date} newReservation.start - The start date of the new reservation.
   * @param {Date} newReservation.end - The end date of the new reservation.
   * @param {Array<Object>} [unsavedEvents=[]] - An optional array of unsaved events from the client-side.
   * @returns {Object} - An object containing the allowability status and additional information.
   * @returns {boolean} return.allow - Indicates if the reservation is allowable.
   * @returns {number} return.size - The number of overlapping reservations.
   * @returns {string} [return.message] - An optional message if the reservation is not allowable.
   * @throws {Error} - If there is an error checking the reservation allowability.
   */
  checkReservationOverlapLimit(newReservation, unsavedEvents = []) {
    this.validateAuth();

    let eventsOverlappingNewReservation = unsavedEvents.filter(event => {
      if (newReservation.id && event.id === newReservation.id) return false;
      return (
        new Date(event.end) > new Date(newReservation.start) &&
        new Date(event.start) < new Date(newReservation.end)
      );
    });

    const overlapMarkers = [];
    eventsOverlappingNewReservation.forEach(evt => {
      overlapMarkers.push({ ts: new Date(evt.start), delta: +1 });
      overlapMarkers.push({ ts: new Date(evt.end), delta: -1 });
    });

    // compare timestamps first, but if those are equal,
    // compare deltas to ensure -1 comes before +1
    overlapMarkers.sort((a, b) => a.ts - b.ts || (a.delta - b.delta));

    let maxOverlap = 0;
    let currentOverlap = 0;
    overlapMarkers.forEach(marker => {
      currentOverlap += marker.delta;
      maxOverlap = Math.max(maxOverlap, currentOverlap);
    });

    if (maxOverlap < 5) {
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
  createReservationDocument = async (userId, reservationData) => {
    this.validateAuth();
    reservationData.archived = false;
    try {
      const { id, ...dataWithoutId } = reservationData; // Remove the ID from the data. It's auto-generated by Firestore

      // Convert the start and end dates to Firestore Timestamps
      dataWithoutId.start = Timestamp.fromDate(new Date(dataWithoutId.start));
      dataWithoutId.end = Timestamp.fromDate(new Date(dataWithoutId.end));

      const userRef = doc(collection(db, "Users"), userId);
      const childRef = doc(collection(db, "Children"), reservationData.extendedProps.childId);

      const dataWithExtraRefs = {
        ...dataWithoutId,
        User: userRef,
        userId: userId,
        Child: childRef,
      }

      const validatedData = await ReservationSchema.validateAsync(dataWithExtraRefs, { abortEarly: false });
      if (validatedData.error) {
        throw new Error(`Validation error: ${validatedData.error.message}`);
      }

      const docRef = await addDoc(collection(db, "Reservations"), validatedData);
      return docRef.id;
    } catch (error) {
      logger.error("Error creating reservation document:", error);
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
  updateReservationDocument = async (reservationData) => {
    this.validateAuth();
    try {
      const { id, ...dataWithoutId } = reservationData; // Remove the ID from the data

      // Convert the start and end dates to Firestore Timestamps
      dataWithoutId.start = Timestamp.fromDate(new Date(dataWithoutId.start));
      dataWithoutId.end = Timestamp.fromDate(new Date(dataWithoutId.end));

      const reservationRef = doc(collection(db, "Reservations"), id);
      await updateDoc(reservationRef, { ...dataWithoutId });
    } catch (error) {
      logger.error("Error updating reservation document:", error);
      throw error;
    }
  };

  /**
   * Changes the status of a reservation document in the Reservations collection.
   * 
   * @param {string} reservationId - The ID of the reservation document to update.
   * @param {string} newStatus - The new status to set for the reservation.
   * @returns {Promise<void>} - A promise that resolves when the document is successfully updated.
   * @throws {Error} - If there is an error updating the document.
   * */
  changeReservationStatus = async (reservationId, newStatus) => {
    this.validateAuth('admin');
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      await updateDoc(reservationRef, { extendedProps: { status: newStatus } });
    } catch (error) {
      logger.error(`Could not change reservation ${reservationId} status to ${newStatus}:`, error);
      throw error;
    }
  }

  // TODO: Add validation to ensure that non-admin users can only change their own reservations
  changeReservationTime = async (reservationId, newStart, newEnd) => {
    this.validateAuth();
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      await updateDoc(reservationRef, {
        start: Timestamp.fromDate(new Date(newStart)),
        end: Timestamp.fromDate(new Date(newEnd))
      });
    } catch (error) {
      logger.error(`Could not change reservation ${reservationId} time:`, error);
      throw error;
    }
  }

  /**
   * Deletes a reservation document from the Reservations collection.
   * 
   * @param {string} reservationId - The ID of the reservation document to delete.
   * @returns {Promise<void>} - A promise that resolves when the document is successfully deleted.
   * @returns {null} - If the reservation document does not exist.
   * @throws {Error} - If there is an error deleting the document.
   */
  deleteReservationDocument = async (reservationId) => {
    this.validateAuth('admin');
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
      logger.error("Error deleting reservation document:", error);
      throw error;
    }
  };

  /**
   * Archives a reservation document in the Reservations collection.
   * 
   * @param {string} reservationId - The ID of the reservation document to archive.
   * @returns {Promise<void>} - A promise that resolves when the document is successfully archived.
   * @returns {null} - If the reservation document does not exist.
   * @throws {Error} - If there is an error archiving the document.
   */
  archiveReservationDocument = async (reservationId) => {
    this.validateAuth();
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const reservationSnapshot = await getDoc(reservationRef);
      if (!reservationSnapshot.exists()) {
        return null;
      }

      const status = reservationSnapshot.data().extendedProps.status;
      if (status === 'pending' || status === 'confirmed') {
        // Archive the document by updating the "archived" field
        await updateDoc(reservationRef, { archived: true });
      } else {
        throw new Error("Cannot archive reservation with status: " + status);
      }
    } catch (error) {
      logger.error("Error archiving reservation document:", error);
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
  async createUserAndAuthenticate(firebaseAuth, email, password) {
    let userCredential = null
    try {
      userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const uid = userCredential.user.uid;

      try {
        await setDoc(doc(db, 'Users', uid), {
          CellNumber: "",
          City: "",
          Email: userCredential.user.email,
          Name: userCredential.user.displayName || "",
          Role: doc(db, 'Roles', 'parent-user'),
          State: "",
          StreetAddress: "",
          Zip: "",
          archived: false,
          paymentHold: false,
          Children: [],
          Contacts: []
        });
        logger.info("User document initialized with template data.");
      } catch (error) {
        logger.error("createUserAndAuthenticate: Could not initialize /Users document with template data: ", error);
        throw error;
      }

      logger.info("User created and authenticated:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      if (userCredential) {
        await deleteUser(userCredential.user);
      }
      logger.error("createUserAndAuthenticate: Could not create new FirebaseAuth account: ", error);
      throw error;
    }
  };

  /**
   * Creates a user profile document from Google authentication data.
   * 
   * @param {Object} authUser - The Firebase Auth user object from Google sign-in.
   * @returns {Promise<void>} A promise that resolves when the user profile is created.
   */
  async createUserProfileFromGoogleAuth(authUser) {
    try {
      await setDoc(doc(db, 'Users', authUser.uid), {
        // Map available Google data
        Email: authUser.email,
        Name: authUser.displayName || "",
        PhotoURL: authUser.PhotoURL || authUser.photoURL || undefined,

        // Hard-coded defaults (same as email/password flow)
        CellNumber: "",
        City: "",
        Role: doc(db, 'Roles', 'parent-user'),
        State: "",
        StreetAddress: "",
        Zip: "",
        archived: false,
        paymentHold: false,
        Children: [],
        Contacts: []
      });

      logger.info("Google user profile created successfully:", authUser.uid);
    } catch (error) {
      logger.error("Error creating Google user profile:", error);
      throw error;
    }
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
  pollForUserDocument = async (db, userId, retries = 10) => {
    this.validateAuth();
    let userDocRef;
    for (let i = 0; i < retries; i++) {
      userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDocRef;
      }
      logger.info(`User document not found, retrying... (${i + 1}/10)`);
      await new Promise(r => setTimeout(r, 1000 * i));
    }
    throw new Error('User document not found after maximum retries.');
  };
}
