import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    route = '/',
    locationState = null,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => {
    // Use MemoryRouter for tests with location state to ensure proper state handling
    if (locationState) {
      return (
        <MemoryRouter 
          initialEntries={[{ pathname: route, state: locationState }]}
        >
          {children}
        </MemoryRouter>
      );
    }
    
    // Use BrowserRouter for tests without location state
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock Firebase Auth functions
export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
};

// Mock Firestore functions
export const mockFirestore = {
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  arrayUnion: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
};

// Mock Firebase Storage functions
export const mockStorage = {
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
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
  ...overrides,
});

export const createMockAdminUser = (overrides = {}) => 
  createMockUser({
    Role: 'admin',
    uid: 'admin-user-123',
    email: 'admin@example.com',
    ...overrides,
  });

export const createMockFirestoreDoc = (data, exists = true) => ({
  id: 'test-doc-id',
  exists: () => exists,
  data: () => data,
});

export const createMockFirestoreSnapshot = (docs = []) => ({
  docs: docs.map(doc => createMockFirestoreDoc(doc)),
});

// Mock form data
export const createMockFormData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'testpassword123',
  confirm: 'testpassword123',
  Name: 'Test User',
  CellNumber: '123-456-7890',
  StreetAddress: '123 Test St',
  City: 'Test City',
  State: 'NC',
  Zip: '12345',
  ...overrides,
});

// Mock file for upload tests
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
  const file = new File(['test content'], name, { type });
  return file;
};

// Helper to wait for async operations
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 1000;
    const start = Date.now();
    
    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      } catch (error) {
        if (Date.now() - start > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

// Mock Google OAuth provider
export const mockGoogleProvider = {
  addScope: jest.fn(),
  setCustomParameters: jest.fn(),
};

// Mock Firebase error
export const createMockFirebaseError = (code, message) => ({
  code,
  message,
  stack: 'Mock error stack',
});

// Common Firebase errors
export const FIREBASE_ERRORS = {
  USER_NOT_FOUND: createMockFirebaseError('auth/user-not-found', 'User not found'),
  WRONG_PASSWORD: createMockFirebaseError('auth/wrong-password', 'Wrong password'),
  EMAIL_ALREADY_IN_USE: createMockFirebaseError('auth/email-already-in-use', 'Email already in use'),
  WEAK_PASSWORD: createMockFirebaseError('auth/weak-password', 'Password is too weak'),
  INVALID_EMAIL: createMockFirebaseError('auth/invalid-email', 'Invalid email'),
  PERMISSION_DENIED: createMockFirebaseError('permission-denied', 'Permission denied'),
};
