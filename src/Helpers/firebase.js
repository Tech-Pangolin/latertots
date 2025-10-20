import { collection, getDocs, getDoc, where, query, arrayUnion, updateDoc, addDoc, doc, setDoc, deleteDoc, Timestamp, onSnapshot, writeBatch } from "@firebase/firestore";
import { db } from "../config/firestore";
import { ref, uploadBytes, getDownloadURL } from "@firebase/storage";
import { storage } from "../config/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { logger } from "./logger";
import { IMAGE_UPLOAD, SERVICE_PRICE_LOOKUP_UIDS, PAYMENT_PRICING } from "./constants";
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

  async validateAuth(requiredRole = null) {
    // Check if user is authenticated
    if (!this.userContext || !this.userContext.uid) {
      throw new Error("Authentication required.");
    }

    // If no specific role is required, authentication is sufficient
    if (!requiredRole) {
      return;
    }

    try {
      // Fetch all valid roles from the Roles collection
      const rolesCollection = collection(db, 'Roles');
      const rolesSnapshot = await getDocs(rolesCollection);
      const validRoles = rolesSnapshot.docs
        .filter(doc => !doc.data().archived) // Only include non-archived roles
        .map(doc => doc.id); // Get the document IDs (role names)

      // Validate that the required role exists in the database
      if (!validRoles.includes(requiredRole)) {
        throw new Error("Invalid role specified.");
      }

      // Check if user has the required role
      const userRole = this.userContext.Role;
      
      // Handle case where user doesn't have a role assigned
      if (!userRole) {
        throw new Error("User role not assigned. Please contact support.");
      }

      // Compare roles (both should be strings at this point)
      if (userRole !== requiredRole) {
        throw new Error("Unauthorized access.");
      }

    } catch (error) {
      // If it's already one of our custom errors, re-throw it
      if (error.message.includes('Invalid role') || 
          error.message.includes('User role not assigned') || 
          error.message.includes('Unauthorized access')) {
        throw error;
      }
      
      // For Firestore errors, provide a more user-friendly message
      logger.error("Error validating user role:", error);
      throw new Error("Unable to validate user permissions. Please try again.");
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
      await this.validateAuth('admin');
    } else {
      await this.validateAuth();
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
  async subscribeDocs(ref, callback, adminOnly = false) {
    if (adminOnly) {
      await this.validateAuth('admin');
    } else {
      await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth();
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
    await this.validateAuth("admin");
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
  async checkReservationOverlapLimit(newReservation, unsavedEvents = []) {
    await this.validateAuth();

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
    await this.validateAuth();
    reservationData.archived = false;
    try {
      const { id, ...dataWithoutId } = reservationData; // Remove the ID from the data. It's auto-generated by Firestore

      // Convert the start and end dates to Firestore Timestamps
      dataWithoutId.start = Timestamp.fromDate(new Date(dataWithoutId.start));
      dataWithoutId.end = Timestamp.fromDate(new Date(dataWithoutId.end));

      const userRef = doc(collection(db, "Users"), userId);
      const childRef = doc(collection(db, "Children"), reservationData.childId);

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
    await this.validateAuth();
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
    await this.validateAuth('admin');
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      await updateDoc(reservationRef, { status: newStatus });
    } catch (error) {
      logger.error(`Could not change reservation ${reservationId} status to ${newStatus}:`, error);
      throw error;
    }
  }

  // TODO: Add validation to ensure that non-admin users can only change their own reservations

  /**
   * Drop off a child for service
   * @param {string} reservationId - The ID of the reservation document to update
   * @param {Timestamp} actualDropOffTime - The actual time the child was dropped off
   * @param {Array} servicesProvided - Array of services provided during drop-off
   * @returns {Promise<void>} - A promise that resolves when the document is successfully updated
   */
  dropOffChild = async (reservationId, actualDropOffTime, servicesProvided = []) => {
    this.validateAuth('admin');
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const now = Timestamp.now();
      
      await updateDoc(reservationRef, {
        status: 'dropped-off',
        'dropOffPickUp.actualStartTime': actualDropOffTime,
        'dropOffPickUp.servicesProvided': servicesProvided,
        updatedAt: now
      });
      
      logger.info('Child dropped off successfully:', { reservationId, actualDropOffTime });
    } catch (error) {
      logger.error('Error dropping off child:', error);
      throw error;
    }
  };

  /**
   * Pick up a child and calculate final payment
   * @param {string} reservationId - The ID of the reservation document to update
   * @param {number} finalAmount - The final amount in cents (optional, will calculate if not provided)
   * @param {number} calculatedAmount - The calculated amount in cents (for override tracking)
   * @param {string} overrideReason - Reason for amount override (optional)
   * @returns {Promise<Object>} - A promise that resolves with checkout session or no payment required
   */
  pickUpChild = async (reservationId, finalAmount = null, calculatedAmount = null, overrideReason = null, selectedActivityId = null) => {
    this.validateAuth('admin');
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const reservationDoc = await getDoc(reservationRef);
      const reservationData = reservationDoc.data();
      const now = Timestamp.now();
      
      // Use provided finalAmount or calculate it with selected activity
      let amountToUse = finalAmount;
      let costBreakdown = null;
      
      if (amountToUse === null) {
        const calculationResult = await this.calculateFinalCheckoutAmount(reservationData, selectedActivityId);
        amountToUse = calculationResult.finalAmount;
        costBreakdown = calculationResult;
      } else {
        // Even with override, calculate breakdown for description
        costBreakdown = await this.calculateFinalCheckoutAmount(reservationData, selectedActivityId);
      }
      
      // Prepare update fields
      const updateFields = {
        status: 'picked-up',
        'dropOffPickUp.actualEndTime': now,
        'dropOffPickUp.finalAmount': amountToUse,
        updatedAt: now
      };
      
      // Add override information if provided
      if (overrideReason) {
        updateFields['dropOffPickUp.overrideReason'] = overrideReason;
        updateFields['dropOffPickUp.calculatedAmount'] = calculatedAmount;
        updateFields['dropOffPickUp.overrideAppliedAt'] = now;
        updateFields['dropOffPickUp.overrideAppliedBy'] = this.userContext.uid;
      }
      
      // Store selected activity if provided
      if (selectedActivityId) {
        updateFields['dropOffPickUp.selectedGroupActivityId'] = selectedActivityId;
      }
      
      // Update reservation with pick-up time
      await updateDoc(reservationRef, updateFields);
      
      // Create checkout session for remainder payment
      if (amountToUse > 0) {
        const checkoutSession = await this.createFinalCheckoutSession(
          reservationId, 
          reservationData, 
          amountToUse,
          costBreakdown,
          overrideReason // Pass override reason if present
        );
        return checkoutSession;
      }
      
      return { success: true, noPaymentRequired: true };
    } catch (error) {
      logger.error('Error picking up child:', error);
      throw error;
    }
  };

  /**
   * Calculate final checkout amount based on actual service time
   * @param {Object} reservationData - The reservation data
   * @returns {Promise<Object>} - Final amount and group activity overlap charge
   */
  calculateFinalCheckoutAmount = async (reservationData, selectedActivityId = null) => {
    // 1. Calculate total actual hours
    const actualStart = reservationData.dropOffPickUp?.actualStartTime;
    if (!actualStart) {
      throw new Error('Child has not been dropped off yet');
    }
    const now = Timestamp.now();
    const actualHours = (now.toMillis() - actualStart.toMillis()) / (1000 * 60 * 60);
    
    // 2. Get service price rates using constants
    const servicePricesQuery = query(collection(db, 'ServicePrices'));
    const pricesSnapshot = await getDocs(servicePricesQuery);
    const prices = {};
    pricesSnapshot.forEach(doc => prices[doc.data().stripeId] = doc.data());
    
    const hourlyRate = prices[SERVICE_PRICE_LOOKUP_UIDS.STANDARD_FEE_FIRST_CHILD_HOURLY]?.pricePerUnitInCents || 2500;
    const lateFeeRate = prices[SERVICE_PRICE_LOOKUP_UIDS.LATE_FEE_HOURLY]?.pricePerUnitInCents || 2500;
    
    // 3. Calculate base cost (up to 4 hours using constant)
    const baseHours = Math.min(actualHours, PAYMENT_PRICING.LATE_FEE_THRESHOLD_HOURS);
    const baseCost = baseHours * hourlyRate;
    
    // 4. Calculate late fee (hours over threshold using constant)
    const overtimeHours = Math.max(0, actualHours - PAYMENT_PRICING.LATE_FEE_THRESHOLD_HOURS);
    const lateFeeCost = overtimeHours * lateFeeRate;
    
    // 5. Calculate group activity cost if applicable
    let groupActivityCost = 0;
    let groupActivityHours = 0;
    let availableActivities = [];
    let activityInfo = null;
    
    if (reservationData.groupActivity) {
      const groupActivityResult = await this.calculateGroupActivityCost(
        actualStart, 
        now, 
        selectedActivityId
      );
      groupActivityCost = groupActivityResult.cost;
      groupActivityHours = groupActivityResult.hours;
      availableActivities = groupActivityResult.availableActivities || [];
      
      if (groupActivityResult.activityName) {
        activityInfo = {
          name: groupActivityResult.activityName,
          rate: groupActivityResult.activityRate,
          isFlat: groupActivityResult.isFlat,
          hasTimeData: groupActivityResult.hasTimeData
        };
      }
    }
    
    // 6. Calculate totals
    const totalServiceCost = baseCost + lateFeeCost + groupActivityCost;
    const amountPaid = await this.getAmountPaidFromStripePayments(reservationData.stripePayments);
    const finalAmount = Math.max(0, totalServiceCost - amountPaid);
    
    return {
      finalAmount,
      actualHours,
      costBreakdown: {
        baseService: {
          hours: baseHours,
          rate: hourlyRate,
          subtotal: baseCost,
          description: 'Base child care service'
        },
        groupActivity: reservationData.groupActivity ? {
          hours: groupActivityHours,
          rate: activityInfo?.rate || 0,
          subtotal: groupActivityCost,
          description: activityInfo ? `${activityInfo.name}${activityInfo.isFlat ? ' (flat rate)' : ''}` : 'No activity selected',
          isFlat: activityInfo?.isFlat || false
        } : null,
        lateFee: overtimeHours > 0 ? {
          hours: overtimeHours,
          rate: lateFeeRate,
          subtotal: lateFeeCost,
          description: `Late fee (over ${PAYMENT_PRICING.LATE_FEE_THRESHOLD_HOURS}-hour limit)`
        } : null,
        totalServiceCost,
        amountPaid,
        amountDue: finalAmount,
        availableActivities // Include for modal dropdown
      }
    };
  };

  /**
   * Get actual payment amounts from Stripe Payment Intent IDs
   * @param {string[]} paymentIntentIds - Array of Stripe Payment Intent IDs
   * @returns {Promise<number>} - Total amount paid in cents
   */
  getPaymentAmountsFromStripe = async (paymentIntentIds) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/latertots-a6694/us-central1/getPaymentAmounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentIds })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const totalAmount = Object.values(result.paymentAmounts)
        .reduce((sum, amount) => sum + amount, 0);
      
      return totalAmount;
    } catch (error) {
      logger.error('Error getting payment amounts from Stripe:', error);
      throw error;
    }
  };

  /**
   * Create final checkout session for remainder payment
   * @param {string} reservationId - The reservation ID
   * @param {Object} reservationData - The reservation data
   * @param {number} finalAmount - The final amount in cents
   * @param {Object} costBreakdown - The detailed cost breakdown
   * @param {string} overrideReason - Reason for amount override (optional)
   * @returns {Promise<Object>} - Checkout session result
   */
  createFinalCheckoutSession = async (reservationId, reservationData, finalAmount, costBreakdown = null, overrideReason = null) => {
    try {
      let serviceDescription = '';
      
      if (costBreakdown) {
        const breakdown = costBreakdown.costBreakdown;
        const services = [];
        
        // Base service line
        if (breakdown.baseService) {
          services.push(
            `${breakdown.baseService.hours.toFixed(1)}h base care ($${(breakdown.baseService.rate / 100).toFixed(2)}/hr) = $${(breakdown.baseService.subtotal / 100).toFixed(2)}`
          );
        }
        
        // Group activity line (only include if there's an actual charge)
        if (breakdown.groupActivity && breakdown.groupActivity.subtotal > 0) {
          const activityDesc = breakdown.groupActivity.isFlat ? 
            `flat rate ${breakdown.groupActivity.description} = $${(breakdown.groupActivity.subtotal / 100).toFixed(2)}` : 
            `${breakdown.groupActivity.hours.toFixed(1)}h ${breakdown.groupActivity.description} ($${(breakdown.groupActivity.rate / 100).toFixed(2)}/hr) = $${(breakdown.groupActivity.subtotal / 100).toFixed(2)}`;
          services.push(activityDesc);
        }
        
        // Late fee line
        if (breakdown.lateFee) {
          services.push(
            `${breakdown.lateFee.hours.toFixed(1)}h late fee ($${(breakdown.lateFee.rate / 100).toFixed(2)}/hr) = $${(breakdown.lateFee.subtotal / 100).toFixed(2)}`
          );
        }
        
        serviceDescription = services.join(', ');
        
        // Add summary section
        serviceDescription += ` | Total Service Cost: $${(breakdown.totalServiceCost / 100).toFixed(2)}`;
        
        if (breakdown.amountPaid > 0) {
          serviceDescription += ` | Previously paid: $${(breakdown.amountPaid / 100).toFixed(2)}`;
        }
        
        serviceDescription += ` | Amount Due: $${(breakdown.amountDue / 100).toFixed(2)}`;
        
        // Add override information if present
        if (overrideReason) {
          serviceDescription += ` | Note: Amount manually adjusted by staff - Reason: ${overrideReason}`;
        }
      } else {
        // Fallback
        serviceDescription = `Full payment - ${(finalAmount / 2500).toFixed(1)} hours`;
      }

      // Call existing createCheckoutSession cloud function
      const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/latertots-a6694/us-central1/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservations: [{
            reservationId: reservationId,
            childName: reservationData.title,
            durationHours: finalAmount / 2500, // Convert cents back to hours for display
            hourlyRateCents: 2500,
            groupActivity: false,
            serviceDescription: serviceDescription
          }],
          paymentType: 'remainder',
          latertotsUserId: reservationData.userId,
          depositPayment: reservationData.stripePayments?.full || reservationData.stripePayments?.minimum || null,
          successUrl: `${window.location.origin}/profile?payment=success&tab=payment`,
          cancelUrl: `${window.location.origin}/profile?payment=failed&tab=payment`
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update reservation with checkout URL
        const reservationRef = doc(collection(db, "Reservations"), reservationId);
        await updateDoc(reservationRef, {
          'dropOffPickUp.finalCheckoutSessionId': result.sessionId,
          'dropOffPickUp.finalCheckoutUrl': result.url
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error creating final checkout session:', error);
      throw error;
    }
  };

  /**
   * Calculate group activity cost with proper rate lookup
   * @param {Timestamp} actualStart - Actual start time
   * @param {Timestamp} actualEnd - Actual end time
   * @returns {Promise<Object>} - Cost and hours for group activity
   */
  calculateGroupActivityCost = async (actualStart, actualEnd, selectedActivityId = null) => {
    // Fetch all service prices
    const servicePricesQuery = query(collection(db, 'ServicePrices'));
    const pricesSnapshot = await getDocs(servicePricesQuery);
    const prices = {};
    pricesSnapshot.forEach(doc => prices[doc.data().stripeId] = doc.data());
    
    // Filter for tot-tivities only (those with daysOfWeek metadata)
    const totTivities = Object.entries(SERVICE_PRICE_LOOKUP_UIDS)
      .filter(([key, uid]) => key.startsWith('TOTIVITY_'))
      .map(([key, uid]) => prices[uid])
      .filter(price => price && price.metadata?.daysOfWeek);
    
    // If no activity selected, return available options
    if (!selectedActivityId) {
      return {
        cost: 0,
        hours: 0,
        availableActivities: totTivities.map(activity => ({
          stripeId: activity.stripeId,
          name: activity.name,
          pricePerUnitInCents: activity.pricePerUnitInCents,
          daysOfWeek: activity.metadata.daysOfWeek,
          startTime: activity.metadata?.startTime || null,
          endTime: activity.metadata?.endTime || null,
          hasTimeData: !!(activity.metadata?.startTime && activity.metadata?.endTime),
          isFlat: activity.stripeId.includes('_FLAT'),
          isHourly: activity.stripeId.includes('_HOURLY')
        }))
      };
    }
    
    // Calculate overlap for selected activity
    const activity = prices[selectedActivityId];
    if (!activity) {
      return { cost: 0, hours: 0 };
    }
    
    // Calculate time overlap (returns 0 if metadata missing)
    const overlapHours = this.calculateActivityTimeOverlap(
      actualStart, 
      actualEnd, 
      activity.metadata?.startTime,
      activity.metadata?.endTime
    );
    
    // Determine pricing based on activity type
    const isFlat = selectedActivityId.includes('_FLAT');
    const cost = isFlat 
      ? (overlapHours > 0 ? activity.pricePerUnitInCents : 0) // Flat: charge full if any overlap
      : Math.round(overlapHours * activity.pricePerUnitInCents); // Hourly: prorate
    
    return {
      cost,
      hours: overlapHours,
      activityName: activity.name,
      activityRate: activity.pricePerUnitInCents,
      isFlat,
      hasTimeData: !!(activity.metadata?.startTime && activity.metadata?.endTime)
    };
  };

  /**
   * Calculate overlap hours between reservation time and activity time
   * @param {Timestamp} actualStart - Reservation start time
   * @param {Timestamp} actualEnd - Reservation end time
   * @param {string} activityStart - Activity start time "HH:MM" (optional)
   * @param {string} activityEnd - Activity end time "HH:MM" (optional)
   * @returns {number} - Overlap hours (0 if times not available)
   */
  calculateActivityTimeOverlap = (actualStart, actualEnd, activityStart, activityEnd) => {
    if (!activityStart || !activityEnd) {
      return 0; // No overlap calculation possible without time data
    }
    
    // Convert Timestamps to Date objects
    const resStart = actualStart.toDate();
    const resEnd = actualEnd.toDate();
    
    // Parse activity times (format: "HH:MM")
    const [actStartHour, actStartMin] = activityStart.split(':').map(Number);
    const [actEndHour, actEndMin] = activityEnd.split(':').map(Number);
    
    // Create activity time windows on the same day as reservation
    const actStart = new Date(resStart);
    actStart.setHours(actStartHour, actStartMin, 0, 0);
    
    const actEnd = new Date(resStart);
    actEnd.setHours(actEndHour, actEndMin, 0, 0);
    
    // Calculate overlap
    const overlapStart = Math.max(resStart.getTime(), actStart.getTime());
    const overlapEnd = Math.min(resEnd.getTime(), actEnd.getTime());
    
    if (overlapEnd <= overlapStart) {
      return 0; // No overlap
    }
    
    // Convert milliseconds to hours
    return (overlapEnd - overlapStart) / (1000 * 60 * 60);
  };

  /**
   * Calculate group activity overlap hours (placeholder implementation)
   * @param {Timestamp} actualStart - Actual start time
   * @param {Timestamp} actualEnd - Actual end time
   * @returns {Promise<number>} - Overlap hours
   */
  calculateGroupActivityOverlap = async (actualStart, actualEnd) => {
    // TODO: Implement actual group activity schedule checking
    // For now, return 0 as placeholder
    return 0;
  };

  /**
   * Get amount paid from stripe payments by querying Stripe API
   * @param {Object} stripePayments - The stripe payments object
   * @returns {Promise<number>} - Amount paid in cents
   */
  getAmountPaidFromStripePayments = async (stripePayments) => {
    if (!stripePayments) {
      return 0;
    }

    // Collect all payment intent IDs
    const paymentIntentIds = [];
    if (stripePayments.minimum) paymentIntentIds.push(stripePayments.minimum);
    if (stripePayments.full) paymentIntentIds.push(stripePayments.full);
    if (stripePayments.remainder) paymentIntentIds.push(stripePayments.remainder);

    if (paymentIntentIds.length === 0) {
      return 0;
    }

    try {
      // Call the new dbService method
      const totalAmount = await this.getPaymentAmountsFromStripe(paymentIntentIds);
      return totalAmount;
    } catch (error) {
      console.error('Error getting payment amounts from Stripe:', error);
      // Return 0 if we can't get actual payment amounts - safer than guessing
      return 0;
    }
  };
  changeReservationTime = async (reservationId, newStart, newEnd) => {
    await this.validateAuth();
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
    await this.validateAuth('admin');
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const reservationSnapshot = await getDoc(reservationRef);
      if (!reservationSnapshot.exists()) {
        return null;
      }

      const status = reservationSnapshot.data().status;
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
    await this.validateAuth();
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const reservationSnapshot = await getDoc(reservationRef);
      if (!reservationSnapshot.exists()) {
        return null;
      }

      const status = reservationSnapshot.data().status;
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
    await this.validateAuth();
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


  /**
   * Gets a form draft for a user
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} - The form draft or null if not found
   */
  getFormDraft = async (userId) => {
    await this.validateAuth();
    try {
      const draftRef = doc(db, 'FormDrafts', userId);
      const draftDoc = await getDoc(draftRef);
      
      if (draftDoc.exists()) {
        return { id: draftDoc.id, ...draftDoc.data() };
      }
      return null;
    } catch (error) {
      logger.error("Error getting form draft:", error);
      throw error;
    }
  };


  /**
   * Creates multiple reservations in a batch with formDraftId
   * 
   * @param {string} userId - The user ID
   * @param {Array} reservationsInput - Array of reservation data
   * @param {string} formDraftId - The form draft ID to associate with reservations
   * @returns {Promise<Array>} - Array of document references for created reservations
   */
  createReservationsBatch = async (userId, reservationsInput, formDraftId) => {
    await this.validateAuth();
    try {
      const batch = writeBatch(db);
      const reservationRefs = [];
      
      for (const reservationData of reservationsInput) {
        const reservationRef = doc(collection(db, 'Reservations'));
        
        // Build the reservation data with required fields
        const userRef = doc(collection(db, 'Users'), userId);
        const childRef = doc(collection(db, 'Children'), reservationData.childId);
        
        const fullReservationData = {
          archived: false,
          status: 'pending',
          start: Timestamp.fromDate(new Date(reservationData.start)),
          end: Timestamp.fromDate(new Date(reservationData.end)),
          title: reservationData.title,
          childId: reservationData.childId,
          userId: userId,
          User: userRef,
          Child: childRef,
          groupActivity: reservationData.groupActivity,
          stripePayments: {
            minimum: null,
            remainder: null,
            full: null
          },
          formDraftId: formDraftId // Associate with form draft
        };
        
        // Validate the data
        const validatedData = await ReservationSchema.validateAsync(fullReservationData, { abortEarly: false });
        if (validatedData.error) {
          throw new Error(`Validation error: ${validatedData.error.message}`);
        }
        
        batch.set(reservationRef, validatedData);
        reservationRefs.push(reservationRef);
      }
      
      await batch.commit();
      logger.info(`Created ${reservationRefs.length} reservations in batch`);
      return reservationRefs;
    } catch (error) {
      logger.error("Error creating reservations batch:", error);
      throw error;
    }
  };

  /**
   * Deletes a reservation by ID
   * 
   * @param {string} reservationId - The reservation ID to delete
   * @returns {Promise<void>} - A promise that resolves when the reservation is deleted
   */
  deleteReservation = async (reservationId) => {
    await this.validateAuth();
    try {
      const reservationRef = doc(db, 'Reservations', reservationId);
      await deleteDoc(reservationRef);
      logger.info(`Reservation ${reservationId} deleted successfully`);
    } catch (error) {
      logger.error("Error deleting reservation:", error);
      throw error;
    }
  };

  /**
   * Get user data by user ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - User data
   */
  getUserData = async (userId) => {
    try {
      const userRef = doc(collection(db, "Users"), userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      return userDoc.data();
    } catch (error) {
      logger.error('Error getting user data:', error);
      throw error;
    }
  };

  /**
   * Get reservation data by reservation ID
   * @param {string} reservationId - The reservation ID
   * @returns {Promise<Object>} - Reservation data
   */
  getReservationData = async (reservationId) => {
    try {
      const reservationRef = doc(collection(db, "Reservations"), reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        throw new Error('Reservation not found');
      }
      
      return reservationDoc.data();
    } catch (error) {
      logger.error('Error getting reservation data:', error);
      throw error;
    }
  };
}
