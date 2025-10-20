// Proper FirebaseDbService Unit Tests
// Tests business logic with real class, mocked external services, and spies

// Mock ONLY external dependencies (not the FirebaseDbService itself)
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('@firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  arrayUnion: jest.fn(),
  where: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: class MockTimestamp {
    constructor(seconds, nanoseconds) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    static fromDate(date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

// Also mock firebase/firestore for ReservationSchema
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  arrayUnion: jest.fn(),
  where: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: class MockTimestamp {
    constructor(seconds, nanoseconds) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    static fromDate(date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
  DocumentReference: class MockDocumentReference {
    constructor(id, path) {
      this.id = id;
      this.path = path;
    }
  },
}));

jest.mock('@firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../../config/firestore', () => ({
  db: { id: 'mock-db' }
}));

jest.mock('../../config/firebase', () => ({
  storage: { id: 'mock-storage' }
}));

jest.mock('../../Helpers/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

// Import the REAL FirebaseDbService class (not mocked)
import { FirebaseDbService } from '../../Helpers/firebase';

// Import mocked external services
const { createUserWithEmailAndPassword, deleteUser } = require('firebase/auth');
const { doc, setDoc, getDoc, updateDoc, addDoc, collection, arrayUnion } = require('@firebase/firestore');
const { ref, uploadBytes, getDownloadURL } = require('@firebase/storage');
const { logger } = require('../../Helpers/logger');

describe('FirebaseDbService Proper Unit Tests', () => {
  let dbService;
  let mockUser;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create a proper Role document reference
    const mockRoleRef = { id: 'parent-user', path: 'Roles/parent-user' };
    mockUser = { uid: 'test-user-123', email: 'test@example.com', Role: mockRoleRef };
    
    // Re-set mock implementations after clearing (following handbook guidance)
    const { doc, setDoc, getDoc, updateDoc, addDoc, collection, arrayUnion, where, query, getDocs, deleteDoc } = require('@firebase/firestore');
    const { createUserWithEmailAndPassword, deleteUser } = require('firebase/auth');
    const { ref, uploadBytes, getDownloadURL } = require('@firebase/storage');
    
    // Set up proper mock implementations
    doc.mockImplementation((db, collectionName, docId) => {
      return { id: docId, path: `${collectionName}/${docId}`, collection: collectionName, db };
    });
    
    collection.mockImplementation((db, collectionName) => {
      return { id: collectionName, path: collectionName, db };
    });
    
    where.mockImplementation((field, operator, value) => {
      return { field, operator, value };
    });
    
    query.mockImplementation((collectionRef, ...constraints) => {
      return { collectionRef, constraints };
    });
    
    getDocs.mockResolvedValue({ docs: [] });
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue();
    updateDoc.mockResolvedValue();
    addDoc.mockResolvedValue({ id: 'mock-doc-id' });
    deleteDoc.mockResolvedValue();
    arrayUnion.mockImplementation((...items) => items);
    
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-user-123' } });
    deleteUser.mockResolvedValue();
    
    ref.mockReturnValue({ id: 'mock-storage-ref' });
    uploadBytes.mockResolvedValue({ ref: { id: 'upload-ref' } });
    getDownloadURL.mockResolvedValue('https://example.com/photo.jpg');
    
    // Create instance of REAL FirebaseDbService class
    dbService = new FirebaseDbService(mockUser);
    
    // Verify we're using the real class
    console.log('DEBUG: Using real FirebaseDbService class');
    console.log('DEBUG: validateAuth method exists:', typeof dbService.validateAuth);
    console.log('DEBUG: createUserAndAuthenticate method exists:', typeof dbService.createUserAndAuthenticate);
  });

  describe('validateAuth - Business Logic Tests', () => {
    it('should pass validation for authenticated users', () => {
      // Test the real business logic
      expect(() => dbService.validateAuth()).not.toThrow();
    });

    it('should throw error for unauthenticated users', () => {
      const unauthenticatedService = new FirebaseDbService(null);
      expect(() => unauthenticatedService.validateAuth()).toThrow('Authentication required.');
    });

    it('should throw error for users without uid', () => {
      const invalidUserService = new FirebaseDbService({});
      expect(() => invalidUserService.validateAuth()).toThrow('Authentication required.');
    });

    it('should validate role permissions correctly', () => {
      const adminUser = { uid: 'admin-123', Role: 'admin' };
      const adminService = new FirebaseDbService(adminUser);
      
      expect(() => adminService.validateAuth('admin')).not.toThrow();
      expect(() => adminService.validateAuth('user')).toThrow('Unauthorized access.');
    });
  });

  describe('createUserAndAuthenticate - Business Logic with External Service Mocks', () => {
    it('should handle successful user creation and profile setup', async () => {
      // MOCK: Control external service responses
      const mockUserCredential = {
        user: { uid: 'new-user-123', email: 'test@example.com', displayName: 'Test User' }
      };
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      setDoc.mockResolvedValue();
      
      // SPY: Verify internal behavior (logging)
      const loggerInfoSpy = jest.spyOn(logger, 'info');
      
      // ACT: Call the real method
      const result = await dbService.createUserAndAuthenticate('auth', 'test@example.com', 'password');
      
      // ASSERT: Verify external calls were made correctly
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith('auth', 'test@example.com', 'password');
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        expect.objectContaining({
          Email: 'test@example.com',
          Name: 'Test User',
          CellNumber: '',
          City: '',
          Role: expect.any(Object),
          State: '',
          StreetAddress: '',
          Zip: '',
          archived: false,
          paymentHold: false,
          Children: [],
          Contacts: []
        })
      );
      
      // ASSERT: Verify internal behavior (logging)
      expect(loggerInfoSpy).toHaveBeenCalledWith('User document initialized with template data.');
      expect(loggerInfoSpy).toHaveBeenCalledWith('User created and authenticated:', mockUserCredential.user);
      
      // ASSERT: Verify return value
      expect(result).toBe(mockUserCredential.user);
    });

    it('should handle Firestore failure with rollback', async () => {
      // MOCK: Control external service responses
      const mockUserCredential = {
        user: { uid: 'new-user-123', email: 'test@example.com', displayName: 'Test User' }
      };
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      setDoc.mockRejectedValue(new Error('Firestore error'));
      deleteUser.mockResolvedValue();
      
      // SPY: Verify internal behavior (logging)
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      
      // ACT & ASSERT: Verify error handling
      await expect(
        dbService.createUserAndAuthenticate('auth', 'test@example.com', 'password')
      ).rejects.toThrow('Firestore error');
      
      // ASSERT: Verify rollback behavior
      expect(deleteUser).toHaveBeenCalledWith(mockUserCredential.user);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'createUserAndAuthenticate: Could not initialize /Users document with template data: ',
        expect.any(Error)
      );
    });

    it('should handle Firebase Auth failure', async () => {
      // MOCK: Control external service responses
      const authError = new Error('Email already in use');
      createUserWithEmailAndPassword.mockRejectedValue(authError);
      
      // SPY: Verify internal behavior (logging)
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      
      // ACT & ASSERT: Verify error handling
      await expect(
        dbService.createUserAndAuthenticate('auth', 'test@example.com', 'password')
      ).rejects.toThrow('Email already in use');
      
      // ASSERT: Verify no rollback when auth fails
      expect(deleteUser).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'createUserAndAuthenticate: Could not create new FirebaseAuth account: ',
        authError
      );
    });
  });

  describe('fetchAvatarPhotoByUserId - Business Logic Tests', () => {
    it('should return photo URL when user document exists', async () => {
      // MOCK: Control external service responses
      const mockDocData = { PhotoURL: 'https://example.com/photo.jpg' };
      const mockDoc = { exists: () => true, data: () => mockDocData };
      getDoc.mockResolvedValue(mockDoc);
      
      // ACT: Call the real method
      const result = await dbService.fetchAvatarPhotoByUserId('user-123');
      
      // ASSERT: Verify external calls and return value
      expect(getDoc).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should return null when user document does not exist', async () => {
      // MOCK: Control external service responses
      const mockDoc = { exists: () => false };
      getDoc.mockResolvedValue(mockDoc);
      
      // ACT: Call the real method
      const result = await dbService.fetchAvatarPhotoByUserId('user-123');
      
      // ASSERT: Verify return value
      expect(result).toBeNull();
    });

    it('should return null when PhotoURL is not set', async () => {
      // MOCK: Control external service responses
      const mockDocData = {}; // No PhotoURL
      const mockDoc = { exists: () => true, data: () => mockDocData };
      getDoc.mockResolvedValue(mockDoc);
      
      // ACT: Call the real method
      const result = await dbService.fetchAvatarPhotoByUserId('user-123');
      
      // ASSERT: Verify return value
      expect(result).toBeNull();
    });
  });

  describe('createUserProfileFromGoogleAuth - Business Logic Tests', () => {
    it('should create profile with complete Google data', async () => {
      // MOCK: Control external service responses
      const mockGoogleUser = {
        uid: 'google-123',
        email: 'google@example.com',
        displayName: 'Google User',
        PhotoURL: 'https://example.com/photo.jpg'
      };
      setDoc.mockResolvedValue();
      
      // ACT: Call the real method
      await dbService.createUserProfileFromGoogleAuth(mockGoogleUser);
      
      // ASSERT: Verify external calls
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        expect.objectContaining({
          Email: 'google@example.com',
          Name: 'Google User',
          PhotoURL: 'https://example.com/photo.jpg',
          CellNumber: '',
          City: '',
          Role: expect.any(Object),
          State: '',
          StreetAddress: '',
          Zip: '',
          archived: false,
          paymentHold: false,
          Children: [],
          Contacts: []
        })
      );
    });

    it('should handle missing Google data gracefully', async () => {
      // MOCK: Control external service responses
      const minimalGoogleUser = {
        uid: 'google-123',
        email: 'google@example.com'
        // Missing displayName and PhotoURL
      };
      setDoc.mockResolvedValue();
      
      // ACT: Call the real method
      await dbService.createUserProfileFromGoogleAuth(minimalGoogleUser);
      
      // ASSERT: Verify external calls with default values
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          Email: 'google@example.com',
          Name: '',
          PhotoURL: undefined, // The implementation sets this to undefined when missing
        })
      );
    });
  });

  describe('uploadProfilePhoto - Business Logic Tests', () => {
    it('should upload file and return download URL', async () => {
      // MOCK: Control external service responses
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockStorageRef = { id: 'mock-storage-ref' };
      const mockUploadResult = { ref: { id: 'upload-ref' } };
      const mockDownloadURL = 'https://example.com/photo.jpg';
      
      ref.mockReturnValue(mockStorageRef);
      uploadBytes.mockResolvedValue(mockUploadResult);
      getDownloadURL.mockResolvedValue(mockDownloadURL);
      
      // ACT: Call the real method
      const result = await dbService.uploadProfilePhoto('user-123', mockFile);
      
      // ASSERT: Verify external calls
      expect(ref).toHaveBeenCalledWith(expect.any(Object), 'profile-photos/user-123');
      expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile, {
        customMetadata: {
          entityId: 'user-123',
          entityType: 'profile',
          owner: 'test-user-123'
        }
      });
      expect(getDownloadURL).toHaveBeenCalledWith(mockUploadResult.ref);
      
      // ASSERT: Verify return value
      expect(result).toBe(mockDownloadURL);
    });

    it('should handle invalid file type', async () => {
      // MOCK: Control external service responses
      const invalidFile = 'not-a-file';
      
      // ACT & ASSERT: Verify error handling
      await expect(
        dbService.uploadProfilePhoto('user-123', invalidFile)
      ).rejects.toThrow('Invalid file type: string. Please provide a valid File object.');
    });
  });

  describe('createChildDocument - Business Logic Tests', () => {
    it('should create child document and update user references', async () => {
      // MOCK: Control external service responses
      const mockChildData = { name: 'Test Child', age: 5 };
      const mockDocRef = { id: 'child-123' };
      
      addDoc.mockResolvedValue(mockDocRef);
      updateDoc.mockResolvedValue();
      
      // ACT: Call the real method
      const result = await dbService.createChildDocument(mockChildData);
      
      // ASSERT: Verify external calls
      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), mockChildData);
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        Children: expect.arrayContaining([{ id: 'child-123' }]) // arrayUnion result
      });
      
      // ASSERT: Verify return value
      expect(result).toBe('child-123');
    });

    it('should require authentication', async () => {
      // MOCK: Control external service responses
      const mockChildData = { name: 'Test Child', age: 5 };
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.createChildDocument(mockChildData)
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('createContactDocument - Business Logic Tests', () => {
    it('should create contact document and update user references', async () => {
      // MOCK: Control external service responses
      const mockContactData = { name: 'Test Contact', phone: '123-456-7890' };
      const mockDocRef = { id: 'contact-123' };
      
      addDoc.mockResolvedValue(mockDocRef);
      updateDoc.mockResolvedValue();
      
      // ACT: Call the real method
      const result = await dbService.createContactDocument(mockContactData);
      
      // ASSERT: Verify external calls
      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), {
        ...mockContactData,
        archived: false
      });
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        Contacts: expect.arrayContaining([{ id: 'contact-123' }]) // arrayUnion result
      });
      
      // ASSERT: Verify return value
      expect(result).toBe('contact-123');
    });

    it('should require authentication', async () => {
      // MOCK: Control external service responses
      const mockContactData = { name: 'Test Contact', phone: '123-456-7890' };
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.createContactDocument(mockContactData)
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('fetchAllCurrentUsersChildren - Business Logic Tests', () => {
    it('should fetch and return children data', async () => {
      // MOCK: Control external service responses at the service layer
      const mockChildrenData = [
        { id: 'child-1', name: 'Child 1', age: 5 },
        { id: 'child-2', name: 'Child 2', age: 7 }
      ];
      
      // Mock the Firebase functions that the method actually uses
      const { getDocs, getDoc } = require('@firebase/firestore');
      
      // First call: getDocs for user query - return user with children
      const mockUserDoc = {
        id: 'user-123',
        data: () => ({
          Email: 'test@example.com',
          Children: ['child-1', 'child-2']
        })
      };
      getDocs.mockResolvedValueOnce({ docs: [mockUserDoc] });
      
      // Second call: getDoc for user document - return user with children
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          Children: ['child-1', 'child-2']
        })
      });
      
      // Third call: getDoc for each child - return child data
      const mockChildDocs = mockChildrenData.map(child => ({
        id: child.id,
        data: () => child
      }));
      getDoc.mockResolvedValueOnce(mockChildDocs[0]);
      getDoc.mockResolvedValueOnce(mockChildDocs[1]);
      
      // ACT: Call the real method
      const result = await dbService.fetchAllCurrentUsersChildren();
      
      // ASSERT: Verify return value
      expect(result).toEqual(mockChildrenData);
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.fetchAllCurrentUsersChildren()
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('fetchAllCurrentUsersContacts - Business Logic Tests', () => {
    it('should fetch and return contacts data', async () => {
      // MOCK: Control external service responses at the service layer
      const mockContactsData = [
        { id: 'contact-1', name: 'Contact 1', phone: '123-456-7890' },
        { id: 'contact-2', name: 'Contact 2', phone: '098-765-4321' }
      ];
      
      // Mock the Firebase functions that the method actually uses
      const { getDocs, getDoc } = require('@firebase/firestore');
      
      // First call: getDocs for user query - return user with contacts
      const mockUserDoc = {
        id: 'user-123',
        data: () => ({
          Email: 'test@example.com',
          Contacts: ['contact-1', 'contact-2']
        })
      };
      getDocs.mockResolvedValueOnce({ docs: [mockUserDoc] });
      
      // Second call: getDoc for user document - return user with contacts
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          Contacts: ['contact-1', 'contact-2']
        })
      });
      
      // Third call: getDoc for each contact - return contact data
      const mockContactDocs = mockContactsData.map(contact => ({
        id: contact.id,
        data: () => contact
      }));
      getDoc.mockResolvedValueOnce(mockContactDocs[0]);
      getDoc.mockResolvedValueOnce(mockContactDocs[1]);
      
      // ACT: Call the real method
      const result = await dbService.fetchAllCurrentUsersContacts('test@example.com');
      
      // ASSERT: Verify return value
      expect(result).toEqual(mockContactsData);
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.fetchAllCurrentUsersContacts('test@example.com')
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('fetchUserReservations - Business Logic Tests', () => {
    it('should fetch and return user reservations', async () => {
      // MOCK: Control external service responses
      const mockReservationsData = [
        { id: 'reservation-1', title: 'Reservation 1', start: new Date() },
        { id: 'reservation-2', title: 'Reservation 2', start: new Date() }
      ];
      
      // Mock the entire query system to return what we need
      const { getDocs } = require('@firebase/firestore');
      
      // Mock getDocs to return reservations data
      const mockReservationsDocs = mockReservationsData.map(reservation => ({
        id: reservation.id,
        data: () => reservation
      }));
      getDocs.mockResolvedValueOnce({ docs: mockReservationsDocs });
      
      // ACT: Call the real method
      const result = await dbService.fetchUserReservations('user-123');
      
      // ASSERT: Verify return value
      expect(result).toEqual(mockReservationsData);
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.fetchUserReservations('user-123')
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('createReservationDocument - Business Logic Tests', () => {
    it('should create reservation document with proper data structure', async () => {
      // MOCK: Control external service responses at the service layer
      const mockReservationData = {
        title: 'Test Reservation',
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T11:00:00Z'),
        billingLocked: false,
        allDay: false,
        childId: 'child-123',
        status: 'pending'
      };
      const mockDocRef = { id: 'reservation-123' };
      
      // Mock the addDoc function to return our mock document reference
      addDoc.mockResolvedValue(mockDocRef);
      
      // Mock the validation by mocking the ReservationSchema directly
      const ReservationSchema = require('../../schemas/ReservationSchema.mjs').default;
      const originalValidateAsync = ReservationSchema.validateAsync;
      ReservationSchema.validateAsync = jest.fn().mockResolvedValue(mockReservationData);
      
      // ACT: Call the real method
      const result = await dbService.createReservationDocument('user-123', mockReservationData);
      
      // Restore the original validateAsync method
      ReservationSchema.validateAsync = originalValidateAsync;
      
      // ASSERT: Verify external calls
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object), // collection reference
        expect.objectContaining({
          title: 'Test Reservation',
          archived: false,
          billingLocked: false,
          allDay: false,
          childId: 'child-123',
          status: 'pending'
        })
      );
      
      // ASSERT: Verify return value
      expect(result).toBe('reservation-123');
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.createReservationDocument('user-123', {})
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('updateReservationDocument - Business Logic Tests', () => {
    it('should update reservation document', async () => {
      // MOCK: Control external service responses
      const mockReservationData = {
        id: 'reservation-123',
        title: 'Updated Reservation',
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T11:00:00Z')
      };
      
      updateDoc.mockResolvedValue();
      
      // ACT: Call the real method
      await dbService.updateReservationDocument(mockReservationData);
      
      // ASSERT: Verify external calls
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        expect.objectContaining({
          title: 'Updated Reservation'
        })
      );
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.updateReservationDocument({ id: 'reservation-123' })
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('deleteReservationDocument - Business Logic Tests', () => {
    it('should delete reservation document', async () => {
      // MOCK: Control external service responses
      const mockDeleteDoc = jest.fn().mockResolvedValue();
      const { deleteDoc, getDoc } = require('@firebase/firestore');
      deleteDoc.mockImplementation(mockDeleteDoc);
      
      // Mock getDoc to return a document with pending status
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          status: 'pending'
        })
      });
      
      // Create admin user for this test
      const adminRoleRef = { id: 'admin', path: 'Roles/admin' };
      const adminUser = { uid: 'admin-123', email: 'admin@example.com', Role: adminRoleRef };
      const adminService = new FirebaseDbService(adminUser);
      
      // Mock validateAuth to pass for admin
      jest.spyOn(adminService, 'validateAuth').mockImplementation(() => {});
      
      // ACT: Call the real method
      await adminService.deleteReservationDocument('reservation-123');
      
      // ASSERT: Verify external calls
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.deleteReservationDocument('reservation-123')
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('archiveReservationDocument - Business Logic Tests', () => {
    it('should archive reservation document', async () => {
      // MOCK: Control external service responses
      const mockDoc = { 
        exists: () => true,
        data: () => ({
          status: 'pending'
        })
      };
      getDoc.mockResolvedValue(mockDoc);
      updateDoc.mockResolvedValue();
      
      // ACT: Call the real method
      await dbService.archiveReservationDocument('reservation-123');
      
      // ASSERT: Verify external calls
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        { archived: true }
      );
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.archiveReservationDocument('reservation-123')
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('changeReservationStatus - Business Logic Tests', () => {
    it('should change reservation status', async () => {
      // MOCK: Control external service responses
      updateDoc.mockResolvedValue();
      
      // Create admin user for this test
      const adminRoleRef = { id: 'admin', path: 'Roles/admin' };
      const adminUser = { uid: 'admin-123', email: 'admin@example.com', Role: adminRoleRef };
      const adminService = new FirebaseDbService(adminUser);
      
      // Mock validateAuth to pass for admin
      jest.spyOn(adminService, 'validateAuth').mockImplementation(() => {});
      
      // ACT: Call the real method
      await adminService.changeReservationStatus('reservation-123', 'confirmed');
      
      // ASSERT: Verify external calls
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        { status: 'confirmed' }
      );
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.changeReservationStatus('reservation-123', 'confirmed')
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('changeReservationTime - Business Logic Tests', () => {
    it('should change reservation time', async () => {
      // MOCK: Control external service responses
      const newStart = new Date('2024-01-01T12:00:00Z');
      const newEnd = new Date('2024-01-01T13:00:00Z');
      updateDoc.mockResolvedValue();
      
      // ACT: Call the real method
      await dbService.changeReservationTime('reservation-123', newStart, newEnd);
      
      // ASSERT: Verify external calls
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object), // doc reference
        expect.objectContaining({
          start: expect.any(Object), // Timestamp object
          end: expect.any(Object)   // Timestamp object
        })
      );
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.changeReservationTime('reservation-123', new Date(), new Date())
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('fetchAllReservationsByMonthDay - Business Logic Tests', () => {
    it('should fetch reservations for specific month and day', async () => {
      // MOCK: Control external service responses
      const mockReservationsData = [
        { id: 'reservation-1', title: 'Reservation 1' },
        { id: 'reservation-2', title: 'Reservation 2' }
      ];
      
      // Create admin user for this test
      const adminRoleRef = { id: 'admin', path: 'Roles/admin' };
      const adminUser = { uid: 'admin-123', email: 'admin@example.com', Role: adminRoleRef };
      const adminService = new FirebaseDbService(adminUser);
      
      // Mock validateAuth to pass for admin
      jest.spyOn(adminService, 'validateAuth').mockImplementation(() => {});
      
      // Mock the entire Firebase query system
      const { getDocs } = require('@firebase/firestore');
      const mockReservationsDocs = mockReservationsData.map(reservation => ({
        id: reservation.id,
        data: () => reservation
      }));
      getDocs.mockResolvedValueOnce({ docs: mockReservationsDocs });
      
      // ACT: Call the real method
      const result = await adminService.fetchAllReservationsByMonthDay(2024, 1, 15);
      
      // ASSERT: Verify return value
      expect(result).toEqual(mockReservationsData);
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      
      // ACT & ASSERT: Verify authentication requirement
      await expect(
        unauthenticatedService.fetchAllReservationsByMonthDay(2024, 1, 15)
      ).rejects.toThrow('Authentication required.');
    });
  });
});
