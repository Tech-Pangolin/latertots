import '@testing-library/jest-dom';


// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    signOut: jest.fn(),
  })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Use setTimeout to simulate async behavior but ensure it completes quickly
    const timeoutId = setTimeout(() => {
      try {
        callback(null);
      } catch (error) {
        console.log('onAuthStateChanged callback error:', error);
      }
    }, 0);
    // Return a cleanup function that clears the timeout
    return () => {
      console.log('=== DEBUGGING: onAuthStateChanged cleanup called ===');
      clearTimeout(timeoutId);
    };
  }),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  arrayUnion: jest.fn(),
  onSnapshot: jest.fn((docRef, callback) => {
    // Use setTimeout to simulate async behavior but ensure it completes quickly
    const timeoutId = setTimeout(() => {
      try {
        callback({
          exists: () => false,
          data: () => ({}),
        });
      } catch (error) {
        console.log('onSnapshot callback error:', error);
      }
    }, 0);
    // Return a cleanup function that clears the timeout
    return () => {
      console.log('=== DEBUGGING: onSnapshot cleanup called ===');
      clearTimeout(timeoutId);
    };
  }),
  Timestamp: class MockTimestamp {
    constructor(date) {
      console.log('=== DEBUGGING: MockTimestamp constructor called with:', date);
      this._date = date || new Date();
    }
    
    static fromDate(date) {
      console.log('=== DEBUGGING: MockTimestamp.fromDate called with:', date);
      return new MockTimestamp(date);
    }
    
    static now() {
      console.log('=== DEBUGGING: MockTimestamp.now called');
      return new MockTimestamp(new Date());
    }
    
    toDate() {
      console.log('=== DEBUGGING: MockTimestamp.toDate called, returning:', this._date);
      return this._date;
    }
    
    toString() {
      return this._date.toString();
    }
    
    valueOf() {
      return this._date.valueOf();
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

// Mock @firebase/firestore
jest.mock('@firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  arrayUnion: jest.fn(),
  onSnapshot: jest.fn((docRef, callback) => {
    const timeoutId = setTimeout(() => {
      try {
        callback({
          exists: () => false,
          data: () => ({}),
        });
      } catch (error) {
        console.log('@firebase/firestore onSnapshot callback error:', error);
      }
    }, 0);
    return () => {
      clearTimeout(timeoutId);
    };
  }),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
  DocumentReference: class MockDocumentReference {
    constructor(id, path) {
      this.id = id;
      this.path = path;
    }
  },
}));

// Mock Firebase config
jest.mock('./config/firebase', () => ({
  app: {},
  analytics: {},
  storage: {},
}));

jest.mock('./config/firestore', () => ({
  db: {},
}));

jest.mock('./config/firebaseAuth', () => ({
  firebaseAuth: {
    currentUser: null,
    signOut: jest.fn(),
  },
}));

// Mock logger
jest.mock('./Helpers/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  setLogLevel: jest.fn(),
  LOG_LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
}));

// FirebaseDbService mocking is now handled per test file
// This allows unit tests to use the real class while integration tests can use mocks

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Don't mock react-hook-form globally - use real implementation in tests

// Mock joi resolver
jest.mock('@hookform/resolvers/joi', () => ({
  joiResolver: jest.fn(() => ({})),
}));

// Global test utilities
global.mockFirebaseUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  PhotoURL: 'https://example.com/photo.jpg',
  Role: 'parent-user',
  Name: 'Test User',
  CellNumber: '123-456-7890',
  StreetAddress: '123 Test St',
  City: 'Test City',
  State: 'NC',
  Zip: '12345',
  Children: [],
  Contacts: [],
  archived: false,
  paymentHold: false,
};

global.mockAdminUser = {
  ...global.mockFirebaseUser,
  Role: 'admin',
  uid: 'admin-user-123',
  email: 'admin@example.com',
};

global.mockFirebaseError = {
  code: 'auth/user-not-found',
  message: 'There is no user record corresponding to this identifier.',
};

// Mock window.location
delete window.location;
window.location = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};
