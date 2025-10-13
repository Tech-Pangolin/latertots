import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../components/AuthProvider';
import LoginPage from '../../components/Pages/LoginPage';
import UserForm from '../../components/Shared/UserForm';
import { FirebaseDbService } from '../../Helpers/firebase';
import { createMockUser, createMockAdminUser, createMockFormData, FIREBASE_ERRORS } from '../../utils/testUtils';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('@firebase/storage');

// Mock the FirebaseDbService
jest.mock('../../Helpers/firebase', () => {
  const mockFetchAvatarPhotoByUserId = jest.fn().mockResolvedValue('https://example.com/avatar.jpg');
  const mockCreateUserProfileFromGoogleAuth = jest.fn().mockResolvedValue();
  const mockCreateUserAndAuthenticate = jest.fn();
  const mockUploadProfilePhoto = jest.fn().mockResolvedValue('https://example.com/uploaded-photo.jpg');
  
  class MockFirebaseDbService {
    constructor(userContext) {
      this.userContext = userContext;
      this.fetchAvatarPhotoByUserId = mockFetchAvatarPhotoByUserId;
      this.createUserProfileFromGoogleAuth = mockCreateUserProfileFromGoogleAuth;
      this.createUserAndAuthenticate = mockCreateUserAndAuthenticate;
      this.uploadProfilePhoto = mockUploadProfilePhoto;
    }
  }
  
  return {
    FirebaseDbService: MockFirebaseDbService,
  };
});

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn({ email: 'test@example.com', password: 'testpassword' });
    }),
    formState: { errors: {} },
    reset: jest.fn(),
  })),
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Mock GoogleIcon
jest.mock('../../components/Shared/GoogleIcon', () => {
  return function MockGoogleIcon({ size }) {
    return <div data-testid="google-icon" data-size={size}>Google Icon</div>;
  };
});

// Test wrapper component
const TestApp = ({ initialRoute = '/login' }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<UserForm />} />
          <Route path="/profile" element={<div data-testid="profile-page">Profile Page</div>} />
          <Route path="/admin" element={<div data-testid="admin-page">Admin Page</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration Tests', () => {
  let mockDbService;
  let mockUnsubAuth;
  let mockUnsubProfile;
  let mockAuthStateCallback;
  let mockProfileCallback;
  let mockCreateUserAndAuthenticate;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock methods from the mocked FirebaseDbService
    mockDbService = new FirebaseDbService();
    mockCreateUserAndAuthenticate = mockDbService.createUserAndAuthenticate;
    
    // Mock the unsubscribe functions
    mockUnsubAuth = jest.fn();
    mockUnsubProfile = jest.fn();
    
    // Mock onAuthStateChanged to store callback and return unsubscribe function
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Store the callback for later use in tests
      mockAuthStateCallback = callback;
      return mockUnsubAuth;
    });
    
    // Mock onSnapshot to store callback and return unsubscribe function
    const { onSnapshot } = require('firebase/firestore');
    onSnapshot.mockImplementation((docRef, callback) => {
      // Store the callback for later use in tests
      mockProfileCallback = callback;
      // Don't call the callback immediately to avoid loading state issues
      return mockUnsubProfile;
    });
  });

  describe('Email/Password Registration Flow', () => {
    it('should complete email/password registration flow', async () => {
      const mockUser = createMockUser();
      mockCreateUserAndAuthenticate.mockResolvedValue(mockUser);

      render(<TestApp initialRoute="/register" />);

      // Simulate no user initially to show registration form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for loading to finish and form to appear
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Email:')).toBeInTheDocument();
      });

      // Fill out registration form
      const emailInput = screen.getByLabelText('Email:');
      const passwordInput = screen.getByLabelText('Password:');
      const confirmInput = screen.getByLabelText('Confirm Password:');
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      fireEvent.change(confirmInput, { target: { value: 'testpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateUserAndAuthenticate).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'testpassword'
        );
      });
    });

    it('should handle registration errors gracefully', async () => {
      mockCreateUserAndAuthenticate.mockRejectedValue(FIREBASE_ERRORS.EMAIL_ALREADY_IN_USE);

      const mockUseMutation = require('@tanstack/react-query').useMutation;
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: { message: 'Email already in use' },
      });

      render(<TestApp initialRoute="/register" />);

      // Simulate no user initially to show registration form
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
      });
    });
  });

  describe('Google OAuth Registration Flow', () => {
    it('should complete Google OAuth registration flow', async () => {
      const { signInWithPopup } = require('firebase/auth');
      const mockGoogleUser = createMockUser();
      signInWithPopup.mockResolvedValue({ user: mockGoogleUser });

      render(<TestApp initialRoute="/register" />);

      // Simulate no user initially to show registration form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
      });

      const googleButton = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });
    });

    it('should handle Google OAuth errors', async () => {
      const { signInWithPopup } = require('firebase/auth');
      signInWithPopup.mockRejectedValue(FIREBASE_ERRORS.USER_NOT_FOUND);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestApp initialRoute="/register" />);

      // Simulate no user initially to show registration form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
      });

      const googleButton = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Email/Password Login Flow', () => {
    it('should complete email/password login flow', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const mockUser = createMockUser();
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'testpassword'
        );
      });
    });

    it('should handle login errors', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue(FIREBASE_ERRORS.WRONG_PASSWORD);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Google OAuth Login Flow', () => {
    it('should complete Google OAuth login flow', async () => {
      const { signInWithPopup } = require('firebase/auth');
      const mockUser = createMockUser();
      signInWithPopup.mockResolvedValue({ user: mockUser });

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
      });

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });
    });
  });

  describe('User Profile Update Flow', () => {
    it('should complete profile update flow', async () => {
      const mockUser = createMockUser();

      const mockUseMutation = require('@tanstack/react-query').useMutation;
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      render(<TestApp initialRoute="/register" />);

      // Simulate user being authenticated
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Wait for user to be loaded and form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should handle profile update errors', async () => {
      const mockUser = createMockUser();

      const mockUseMutation = require('@tanstack/react-query').useMutation;
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: { message: 'Update failed' },
      });

      render(<TestApp initialRoute="/register" />);

      // Simulate user being authenticated
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Role-based Navigation', () => {
    it('should redirect admin users to admin dashboard', async () => {
      const mockAdminUser = createMockAdminUser();

      render(<TestApp initialRoute="/login" />);

      // Simulate admin user being authenticated
      act(() => {
        mockAuthStateCallback(mockAdminUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-page')).toBeInTheDocument();
      });
    });

    it('should redirect regular users to profile page', async () => {
      const mockUser = createMockUser();

      render(<TestApp initialRoute="/login" />);

      // Simulate regular user being authenticated
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication state across page refreshes', async () => {
      const mockUser = createMockUser();

      render(<TestApp initialRoute="/login" />);

      // Simulate user being authenticated (like after page refresh)
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      });
    });

    it('should handle authentication state changes', async () => {
      render(<TestApp initialRoute="/login" />);

      // Initially no user - should show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });

      // User logs in
      const mockUser = createMockUser();
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      });

      // User logs out
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate password confirmation in registration', async () => {
      render(<TestApp initialRoute="/register" />);

      // Simulate no user initially to show registration form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Password:')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password:');
      const confirmInput = screen.getByLabelText('Confirm Password:');
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should validate required fields in login', async () => {
      const mockUseForm = require('react-hook-form').useForm;
      mockUseForm.mockReturnValue({
        register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
        handleSubmit: jest.fn((fn) => fn),
        formState: { 
          errors: { 
            email: { type: 'required' },
            password: { type: 'required' }
          } 
        },
      });

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ user: createMockUser() });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // First attempt fails
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      // Second attempt succeeds
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(2);
      });

      consoleSpy.mockRestore();
    });

    it('should handle Firebase service outages', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue(new Error('Firebase service unavailable'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestApp initialRoute="/login" />);

      // Simulate no user initially to show login form
      act(() => {
        mockAuthStateCallback(null);
      });

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
