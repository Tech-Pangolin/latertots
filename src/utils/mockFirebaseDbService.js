/**
 * Shared base mock for FirebaseDbService that can be extended by different test suites
 * This prevents conflicts between test suites that need different mock behaviors
 */

// Base mock implementation with common methods
export const createBaseFirebaseDbServiceMock = () => ({
  // Common methods that most tests need
  validateAuth: jest.fn(),
  fetchAvatarPhotoByUserId: jest.fn(),
  createUserAndAuthenticate: jest.fn(),
  createUserProfileFromGoogleAuth: jest.fn(),
  uploadProfilePhoto: jest.fn(),
  uploadChildPhoto: jest.fn(),
  createChildDocument: jest.fn(),
  createContactDocument: jest.fn(),
  fetchAllCurrentUsersChildren: jest.fn(),
  fetchAllCurrentUsersContacts: jest.fn(),
  uploadPhoto: jest.fn(),
  fetchUserReservations: jest.fn(),
  fetchAllReservationsByMonthDay: jest.fn(),
  createReservationDocument: jest.fn(),
  updateReservationDocument: jest.fn(),
  changeReservationStatus: jest.fn(),
  changeReservationTime: jest.fn(),
  deleteReservationDocument: jest.fn(),
  archiveReservationDocument: jest.fn(),
  pollForUserDocument: jest.fn(),
});

/**
 * Creates a specialized mock for UserForm tests
 * These tests need specific behaviors for form interactions
 */
export const createUserFormFirebaseDbServiceMock = () => {
  const baseMock = createBaseFirebaseDbServiceMock();
  
  // UserForm-specific mock behaviors
  return {
    ...baseMock,
    createUserAndAuthenticate: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    uploadProfilePhoto: jest.fn().mockResolvedValue('https://example.com/photo.jpg'),
    // Add other UserForm-specific behaviors as needed
  };
};

/**
 * Creates a specialized mock for FirebaseDbService tests
 * These tests need full control over all method behaviors
 */
export const createFirebaseDbServiceTestMock = () => {
  const baseMock = createBaseFirebaseDbServiceMock();
  
  // FirebaseDbService test-specific mock behaviors
  // These tests need the methods to actually call Firebase functions
  return {
    ...baseMock,
    // Override methods to call real Firebase functions when needed
    createUserAndAuthenticate: jest.fn().mockImplementation(async (firebaseAuth, email, password) => {
      const { createUserWithEmailAndPassword, deleteUser } = require('firebase/auth');
      const { doc, setDoc } = require('@firebase/firestore');
      const { db } = require('../../config/firestore');
      
      let userCredential = null;
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
        } catch (error) {
          // Rollback: delete the user if Firestore fails
          if (userCredential && userCredential.user) {
            await deleteUser(userCredential.user);
          }
          throw error;
        }
        
        return userCredential.user;
      } catch (error) {
        throw error;
      }
    }),
    
    createUserProfileFromGoogleAuth: jest.fn().mockImplementation(async (authUser) => {
      const { doc, setDoc } = require('@firebase/firestore');
      const { db } = require('../../config/firestore');
      
      await setDoc(doc(db, 'Users', authUser.uid), {
        Email: authUser.email,
        Name: authUser.displayName || "",
        PhotoURL: authUser.PhotoURL || authUser.photoURL || "",
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
    }),
    
    validateAuth: jest.fn().mockImplementation((requiredRole = null) => {
      if (!this.userContext || !this.userContext.uid) {
        throw new Error("Authentication required.");
      }
      if (requiredRole && this.userContext.Role !== requiredRole) {
        throw new Error("Unauthorized access.");
      }
    }),
    
    fetchAvatarPhotoByUserId: jest.fn().mockImplementation(async (userId) => {
      const { doc, getDoc } = require('@firebase/firestore');
      const { db } = require('../../config/firestore');
      
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data().PhotoURL || null;
      }
      return null;
    }),
    
    uploadProfilePhoto: jest.fn().mockImplementation(async (userId, file) => {
      const { ref, uploadBytes, getDownloadURL } = require('@firebase/storage');
      const { storage } = require('../../config/firebase');
      
      if (!(file instanceof File)) {
        throw new Error(`Invalid file type: ${typeof file}. Please provide a valid File object.`);
      }
      
      const storageRef = ref(storage, `profile-photos/${userId}`);
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          owner: userId,
          type: 'profile-photo'
        }
      });
      return await getDownloadURL(uploadResult.ref);
    }),
    
    uploadChildPhoto: jest.fn().mockImplementation(async (childId, file) => {
      const { ref, uploadBytes, getDownloadURL } = require('@firebase/storage');
      const { storage } = require('../../config/firebase');
      
      if (!(file instanceof File)) {
        throw new Error(`Invalid file type: ${typeof file}. Please provide a valid File object.`);
      }
      
      const storageRef = ref(storage, `child-photos/${childId}`);
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          owner: this.userContext.uid,
          type: 'child-photo'
        }
      });
      return await getDownloadURL(uploadResult.ref);
    }),
    
    createChildDocument: jest.fn().mockImplementation(async (childData) => {
      this.validateAuth();
      const { addDoc, collection, updateDoc, doc, arrayUnion } = require('@firebase/firestore');
      const { db } = require('../../config/firestore');
      
      const docRef = await addDoc(collection(db, "Children"), childData);
      const userRef = doc(collection(db, "Users"), this.userContext.uid);
      await updateDoc(userRef, { Children: arrayUnion(docRef) });
      return docRef.id;
    }),
    
    createContactDocument: jest.fn().mockImplementation(async (contactData) => {
      this.validateAuth();
      const { addDoc, collection, updateDoc, doc, arrayUnion } = require('@firebase/firestore');
      const { db } = require('../../config/firestore');
      
      const docRef = await addDoc(collection(db, "Contacts"), {
        ...contactData,
        archived: false
      });
      const userRef = doc(collection(db, "Users"), this.userContext.uid);
      await updateDoc(userRef, { Contacts: arrayUnion(docRef) });
      return docRef.id;
    })
  };
};

/**
 * Sets up the FirebaseDbService mock for a specific test suite
 * @param {string} testSuite - The test suite name ('userForm' or 'firebaseDbService')
 */
export const setupFirebaseDbServiceMock = (testSuite) => {
  const { FirebaseDbService } = require('../../Helpers/firebase');
  
  let mockImplementation;
  switch (testSuite) {
    case 'userForm':
      mockImplementation = createUserFormFirebaseDbServiceMock();
      break;
    case 'firebaseDbService':
      mockImplementation = createFirebaseDbServiceTestMock();
      break;
    default:
      mockImplementation = createBaseFirebaseDbServiceMock();
  }
  
  // Clear any existing mocks and set up the new one
  FirebaseDbService.mockClear();
  FirebaseDbService.mockImplementation(() => mockImplementation);
  
  return mockImplementation;
};

/**
 * Cleans up the FirebaseDbService mock after tests
 */
export const cleanupFirebaseDbServiceMock = () => {
  const { FirebaseDbService } = require('../../Helpers/firebase');
  FirebaseDbService.mockClear();
  FirebaseDbService.mockRestore();
};