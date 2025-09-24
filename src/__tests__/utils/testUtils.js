import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { generateChildSchema } from '../../schemas/ChildSchema';

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

// Wrapper component that uses real useForm hook for testing
export const ChildRegistrationWrapper = ({ setOpenStateFxn, addAlertFxn, editingChild, onSubmit }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: require('@hookform/resolvers/joi').joiResolver(generateChildSchema(true))
  });

  // Pre-populate form if editingChild is provided
  React.useEffect(() => {
    if (editingChild) {
      const formData = {
        Name: editingChild.Name,
        DOB: editingChild.DOB ? require('../../Helpers/datetime').firebaseTimestampToFormDateString(editingChild.DOB) : '',
        Gender: editingChild.Gender,
        Allergies: editingChild.Allergies || '',
        Medications: editingChild.Medications || '',
        Notes: editingChild.Notes || '',
        PhotoURL: editingChild.PhotoURL || ''
      };
      reset(formData);
    }
  }, [editingChild, reset]);

  return (
    <div className='container bg-white'>
      <h1 className="text-center pt-5">{editingChild ? 'Edit Child' : 'Child Registration'}</h1>
      <p className="text-center">{editingChild ? 'Update your child\'s information' : 'Add your child here!'}</p>
      <div className="row d-flex justify-content-center">
        <form onSubmit={handleSubmit(onSubmit)} className='col-md-12'>
          <label htmlFor="Name" className="form-label">Name:</label>
          <input type="text" disabled={editingChild?.Name} id="NameChild" {...register('Name')} className="form-control" />
          {errors.Name?.message && <p>{errors.Name.message}</p>}

          <label htmlFor="DOB" className="form-label">DOB:</label>
          <input type="date" id="DOB" {...register('DOB')} className="form-control" />
          {errors.DOB?.message && <p>{errors.DOB.message}</p>}

          <label htmlFor="Gender" className="form-label">Gender:</label>
          <select id="Gender" {...register('Gender')} className="form-control">
            {Object.values(require('../../Helpers/constants').GENDERS).map(option => {
              return <option key={option} value={option}>{option}</option>;
            })}
          </select>
          {errors.Gender?.message && <p>{errors.Gender.message}</p>}

          <label htmlFor="Allergies" className="form-label">Allergies:</label>
          <input type="text" id="Allergies" {...register('Allergies')} className="form-control" />

          <label htmlFor="Medications" className="form-label">Medications:</label>
          <input type="text" id="Medications" {...register('Medications')} className="form-control" />

          <label htmlFor="Notes" className="form-label">Notes:</label>
          <input type="text" id="Notes" {...register('Notes')} className="form-control" />

          <div className="mb-3">
            <label htmlFor="Image" className="form-label">Photo</label>
            <input
              type="file"
              id="Image"
              {...register("Image")}
              className="form-control"
              accept="image/*"
            />
            {errors.Image?.message && <p className="text-danger">{errors.Image.message}</p>}
          </div>

          <button 
            type="submit" 
            className="my-5 btn btn-primary login-btn w-100"
          >
            {editingChild ? 'Update Child' : 'Add Child'}
          </button>
        </form>
      </div>
    </div>
  );
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
