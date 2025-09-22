// Mock Firebase modules first, before any imports
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('@firebase/firestore', () => {
  // Mock Timestamp constructor for ReservationSchema
  const MockTimestamp = jest.fn();
  MockTimestamp.fromDate = jest.fn();
  MockTimestamp.now = jest.fn();

  // Mock DocumentReference constructor
  const MockDocumentReference = jest.fn();

  // Create a simple mock that returns a proper object
  const mockDoc = jest.fn((db, collection, docId) => {
    return { 
      id: docId || 'mock-doc-ref',
      path: `${collection}/${docId}`,
      collection: collection,
      db: db
    };
  });

  return {
    doc: mockDoc,
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    collection: jest.fn(() => ({ id: 'mock-collection' })),
    arrayUnion: jest.fn(),
    getDocs: jest.fn(),
    where: jest.fn(),
    query: jest.fn(),
    deleteDoc: jest.fn(),
    onSnapshot: jest.fn(),
    Timestamp: MockTimestamp,
    DocumentReference: MockDocumentReference,
  };
});

jest.mock('@firebase/storage', () => ({
  ref: jest.fn(() => ({ id: 'mock-storage-ref' })),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Firebase config files
jest.mock('../../config/firestore', () => ({
  db: { id: 'mock-db' }
}));

jest.mock('../../config/firebase', () => ({
  storage: { id: 'mock-storage' }
}));

// Mock ReservationSchema to prevent Timestamp dependency issues
jest.mock('../../schemas/ReservationSchema', () => ({
  default: jest.fn()
}));

import { FirebaseDbService } from '../../Helpers/firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, arrayUnion } from '@firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { createMockUser, createMockAdminUser, createMockFile, FIREBASE_ERRORS } from '../utils/testUtils';


describe('FirebaseDbService Authentication Methods', () => {
  let dbService;
  let mockUser;
  let mockFirebaseAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-set the mock implementations after clearing
    doc.mockImplementation((db, collection, docId) => {
      return { 
        id: docId || 'mock-doc-ref',
        path: `${collection}/${docId}`,
        collection: collection,
        db: db
      };
    });
    
    collection.mockImplementation((db, collectionName) => {
      return { 
        id: collectionName,
        path: collectionName,
        db: db
      };
    });
    
    ref.mockImplementation((storage, path) => {
      return { 
        id: 'mock-storage-ref',
        path: path,
        storage: storage
      };
    });
    
    arrayUnion.mockImplementation((...values) => {
      // arrayUnion returns a function that when called returns the values
      return () => values;
    });
    
    // Reset Firebase Auth mocks and set default implementations
    createUserWithEmailAndPassword.mockReset();
    deleteUser.mockReset();
    
    // Set default implementations that can be overridden by tests
    createUserWithEmailAndPassword.mockImplementation(() => Promise.resolve({ 
      user: { uid: 'new-user-123', email: 'test@example.com', displayName: 'Test User' } 
    }));
    deleteUser.mockImplementation(() => Promise.resolve());
    
    mockUser = createMockUser();
    mockFirebaseAuth = {
      currentUser: mockUser,
    };
    
    dbService = new FirebaseDbService(mockUser);
  });

  describe('createUserAndAuthenticate', () => {
    const email = 'test@example.com';
    const password = 'testpassword123';

    it('should create Firebase user and Firestore profile successfully', async () => {
      const mockUserCredential = {
        user: {
          uid: 'new-user-123',
          email: email,
          displayName: 'Test User',
        },
      };

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      setDoc.mockResolvedValue();

      const result = await dbService.createUserAndAuthenticate(mockFirebaseAuth, email, password);

      // Debug logging

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockFirebaseAuth, email, password);
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          Email: email,
          Name: 'Test User',
          Role: expect.any(Object),
          CellNumber: '',
          City: '',
          State: '',
          StreetAddress: '',
          Zip: '',
          archived: false,
          paymentHold: false,
          Children: [],
          Contacts: [],
        })
      );
      expect(result).toEqual(mockUserCredential.user);
    });

    it('should rollback on Firestore failure', async () => {
      const mockUserCredential = {
        user: {
          uid: 'new-user-123',
          email: email,
          displayName: 'Test User',
        },
      };

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      setDoc.mockRejectedValue(new Error('Firestore error'));
      deleteUser.mockResolvedValue();

      await expect(
        dbService.createUserAndAuthenticate(mockFirebaseAuth, email, password)
      ).rejects.toThrow('Firestore error');

      expect(deleteUser).toHaveBeenCalledWith(mockUserCredential.user);
    });

    it('should handle Firebase Auth creation failure', async () => {
      createUserWithEmailAndPassword.mockImplementation(() => Promise.reject(FIREBASE_ERRORS.EMAIL_ALREADY_IN_USE));

      // Use manual try-catch instead of expect().rejects.toThrow()
      let thrownError = null;
      try {
        await dbService.createUserAndAuthenticate(mockFirebaseAuth, email, password);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeTruthy();
      expect(thrownError.message).toContain('Email already in use');

      expect(setDoc).not.toHaveBeenCalled();
      expect(deleteUser).not.toHaveBeenCalled();
    });

    it('should handle weak password error', async () => {
      createUserWithEmailAndPassword.mockImplementation(() => Promise.reject(FIREBASE_ERRORS.WEAK_PASSWORD));

      // Use manual try-catch instead of expect().rejects.toThrow()
      let thrownError = null;
      try {
        await dbService.createUserAndAuthenticate(mockFirebaseAuth, email, '123');
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeTruthy();
      expect(thrownError.message).toContain('Password is too weak');
    });

    it('should handle invalid email error', async () => {
      createUserWithEmailAndPassword.mockImplementation(() => Promise.reject(FIREBASE_ERRORS.INVALID_EMAIL));

      // Use manual try-catch instead of expect().rejects.toThrow()
      let thrownError = null;
      try {
        await dbService.createUserAndAuthenticate(mockFirebaseAuth, 'invalid-email', password);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeTruthy();
      expect(thrownError.message).toContain('Invalid email');
    });
  });

  describe('createUserProfileFromGoogleAuth', () => {
    const mockGoogleUser = {
      uid: 'google-user-123',
      email: 'google@example.com',
      displayName: 'Google User',
      PhotoURL: 'https://example.com/google-photo.jpg',
    };

    it('should create profile with Google data', async () => {
      setDoc.mockResolvedValue();

      await dbService.createUserProfileFromGoogleAuth(mockGoogleUser);

      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          Email: mockGoogleUser.email,
          Name: mockGoogleUser.displayName,
          PhotoURL: mockGoogleUser.PhotoURL,
          Role: expect.any(Object),
          CellNumber: '',
          City: '',
          State: '',
          StreetAddress: '',
          Zip: '',
          archived: false,
          paymentHold: false,
          Children: [],
          Contacts: [],
        })
      );
    });

    it('should handle missing Google data gracefully', async () => {
      const mockGoogleUserMinimal = {
        uid: 'google-user-123',
        email: 'google@example.com',
        // Missing displayName and PhotoURL
      };

      setDoc.mockResolvedValue();

      await dbService.createUserProfileFromGoogleAuth(mockGoogleUserMinimal);

      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          Email: mockGoogleUserMinimal.email,
          Name: '',
          PhotoURL: undefined,
        })
      );
    });

    it('should handle Firestore errors', async () => {
      setDoc.mockRejectedValue(new Error('Firestore connection failed'));

      await expect(
        dbService.createUserProfileFromGoogleAuth(mockGoogleUser)
      ).rejects.toThrow('Firestore connection failed');
    });
  });

  describe('validateAuth', () => {
    it('should throw error for unauthenticated users', () => {
      const unauthenticatedService = new FirebaseDbService(null);

      expect(() => unauthenticatedService.validateAuth()).toThrow('Authentication required.');
    });

    it('should throw error for users without uid', () => {
      const invalidUserService = new FirebaseDbService({});

      expect(() => invalidUserService.validateAuth()).toThrow('Authentication required.');
    });

    it('should pass validation for authenticated users', () => {
      expect(() => dbService.validateAuth()).not.toThrow();
    });

    it('should validate admin role correctly', () => {
      const adminUser = createMockAdminUser();
      const adminService = new FirebaseDbService(adminUser);

      expect(() => adminService.validateAuth('admin')).not.toThrow();
    });

    it('should throw error for insufficient role permissions', () => {
      expect(() => dbService.validateAuth('admin')).toThrow('Unauthorized access.');
    });

    it('should validate parent role correctly', () => {
      expect(() => dbService.validateAuth('parent-user')).not.toThrow();
    });
  });

  describe('fetchAvatarPhotoByUserId', () => {
    it('should return photo URL when user document exists', async () => {
      const userId = 'user-123';
      const photoURL = 'https://example.com/avatar.jpg';

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ PhotoURL: photoURL }),
      });

      const result = await dbService.fetchAvatarPhotoByUserId(userId);

      expect(getDoc).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toBe(photoURL);
    });

    it('should return null when user document does not exist', async () => {
      const userId = 'nonexistent-user';

      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await dbService.fetchAvatarPhotoByUserId(userId);

      expect(result).toBeNull();
    });

    it('should return null when PhotoURL is not set', async () => {
      const userId = 'user-123';

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ /* PhotoURL not present */ }),
      });

      const result = await dbService.fetchAvatarPhotoByUserId(userId);

      expect(result).toBeNull();
    });

    it('should handle Firestore errors', async () => {
      const userId = 'user-123';

      getDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(
        dbService.fetchAvatarPhotoByUserId(userId)
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('uploadProfilePhoto', () => {
    it('should upload file and return download URL', async () => {
      const userId = 'user-123';
      const mockFile = createMockFile('profile.jpg', 'image/jpeg');
      const downloadURL = 'https://example.com/uploaded-photo.jpg';

      uploadBytes.mockResolvedValue({ ref: 'mock-ref' });
      getDownloadURL.mockResolvedValue(downloadURL);

      const result = await dbService.uploadProfilePhoto(userId, mockFile);

      expect(ref).toHaveBeenCalledWith(expect.any(Object), `profile-photos/${userId}`);
      expect(uploadBytes).toHaveBeenCalledWith(expect.any(Object), mockFile);
      expect(getDownloadURL).toHaveBeenCalledWith('mock-ref');
      expect(result).toBe(downloadURL);
    });

    it('should throw error for invalid file type', async () => {
      const userId = 'user-123';
      const invalidFile = 'not-a-file';

      await expect(
        dbService.uploadProfilePhoto(userId, invalidFile)
      ).rejects.toThrow('Invalid file type: string. Please provide a valid File object.');
    });

    it('should handle upload errors', async () => {
      const userId = 'user-123';
      const mockFile = createMockFile();

      uploadBytes.mockRejectedValue(new Error('Upload failed'));

      await expect(
        dbService.uploadProfilePhoto(userId, mockFile)
      ).rejects.toThrow('Upload failed');
    });

    it('should handle download URL errors', async () => {
      const userId = 'user-123';
      const mockFile = createMockFile();

      uploadBytes.mockResolvedValue({ ref: 'mock-ref' });
      getDownloadURL.mockRejectedValue(new Error('Download URL failed'));

      await expect(
        dbService.uploadProfilePhoto(userId, mockFile)
      ).rejects.toThrow('Download URL failed');
    });
  });

  describe('createChildDocument', () => {
    it('should create child document and update user references', async () => {
      const childData = {
        name: 'Test Child',
        age: 5,
        gender: 'Male',
      };

      const mockDocRef = { id: 'child-123' };
      addDoc.mockResolvedValue(mockDocRef);
      updateDoc.mockResolvedValue();

      const result = await dbService.createChildDocument(childData);

      expect(addDoc).toHaveBeenCalledWith(expect.any(Object), childData);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        { Children: expect.any(Function) }
      );
      expect(result).toBe('child-123');
    });

    it('should handle creation errors', async () => {
      const childData = { name: 'Test Child' };

      addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(
        dbService.createChildDocument(childData)
      ).rejects.toThrow('Creation failed');
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      const childData = { name: 'Test Child' };

      await expect(
        unauthenticatedService.createChildDocument(childData)
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('createContactDocument', () => {
    it('should create contact document and update user references', async () => {
      const contactData = {
        name: 'Test Contact',
        phone: '123-456-7890',
        relationship: 'Parent',
      };

      const mockDocRef = { id: 'contact-123' };
      addDoc.mockResolvedValue(mockDocRef);
      updateDoc.mockResolvedValue();

      const result = await dbService.createContactDocument(contactData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...contactData,
          archived: false,
        })
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        { Contacts: expect.any(Function) }
      );
      expect(result).toBe('contact-123');
    });

    it('should handle creation errors', async () => {
      const contactData = { name: 'Test Contact' };

      addDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(
        dbService.createContactDocument(contactData)
      ).rejects.toThrow('Creation failed');
    });

    it('should require authentication', async () => {
      const unauthenticatedService = new FirebaseDbService(null);
      const contactData = { name: 'Test Contact' };

      await expect(
        unauthenticatedService.createContactDocument(contactData)
      ).rejects.toThrow('Authentication required.');
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');
      createUserWithEmailAndPassword.mockRejectedValue(networkError);

      await expect(
        dbService.createUserAndAuthenticate(mockFirebaseAuth, 'test@example.com', 'password')
      ).rejects.toThrow('Network request failed');
    });

    it('should handle Firestore permission errors', async () => {
      const permissionError = new Error('Missing or insufficient permissions');
      setDoc.mockRejectedValue(permissionError);

      const mockGoogleUser = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      await expect(
        dbService.createUserProfileFromGoogleAuth(mockGoogleUser)
      ).rejects.toThrow('Missing or insufficient permissions');
    });

    it('should handle storage errors', async () => {
      const storageError = new Error('Storage quota exceeded');
      uploadBytes.mockRejectedValue(storageError);

      const mockFile = createMockFile();

      await expect(
        dbService.uploadProfilePhoto('user-123', mockFile)
      ).rejects.toThrow('Storage quota exceeded');
    });
  });
});
