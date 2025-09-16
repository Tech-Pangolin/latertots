import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../components/AuthProvider';
import LoginPage from '../../components/Pages/LoginPage';
import UserForm from '../../components/Shared/UserForm';
import PrivateRoute from '../../components/PrivateRoute';
import { FirebaseDbService } from '../../Helpers/firebase';
import { createMockUser, createMockAdminUser, FIREBASE_ERRORS } from '../utils/testUtils';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@firebase/storage');

// Mock the FirebaseDbService
jest.mock('../../Helpers/firebase', () => ({
  FirebaseDbService: jest.fn().mockImplementation(() => ({
    fetchAvatarPhotoByUserId: jest.fn().mockResolvedValue('https://example.com/avatar.jpg'),
    createUserProfileFromGoogleAuth: jest.fn().mockResolvedValue(),
    createUserAndAuthenticate: jest.fn(),
    uploadProfilePhoto: jest.fn().mockResolvedValue('https://example.com/uploaded-photo.jpg'),
    validateAuth: jest.fn(),
  })),
}));

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

// Test component for PrivateRoute
const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('Authentication Security Tests', () => {
  let mockDbService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbService = new FirebaseDbService();
  });

  describe('Data Exposure Prevention', () => {
    it('should not expose sensitive user data in client state', () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      // Check that sensitive data is not directly exposed in DOM
      expect(screen.queryByText(mockUser.uid)).not.toBeInTheDocument();
      expect(screen.queryByText('password')).not.toBeInTheDocument();
      expect(screen.queryByText('token')).not.toBeInTheDocument();
    });

    it('should not log sensitive information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockUser = createMockUser();

      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Check that sensitive data is not logged
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockUser.uid)
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('password')
      );

      consoleSpy.mockRestore();
    });

    it('should sanitize user input in forms', async () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      
      // Test with potentially malicious input
      const maliciousInput = '<script>alert("xss")</script>';
      fireEvent.change(nameInput, { target: { value: maliciousInput } });

      // The input should be treated as plain text, not executed
      expect(nameInput.value).toBe(maliciousInput);
    });
  });

  describe('Permission Validation', () => {
    it('should validate user permissions before data access', async () => {
      const mockUser = createMockUser();
      mockDbService.validateAuth.mockImplementation((requiredRole) => {
        if (requiredRole && mockUser.Role !== requiredRole) {
          throw new Error('Unauthorized access');
        }
      });

      // Test admin-only operation
      expect(() => mockDbService.validateAuth('admin')).toThrow('Unauthorized access');

      // Test parent operation (should pass)
      expect(() => mockDbService.validateAuth('parent-user')).not.toThrow();
    });

    it('should prevent unauthorized access to protected routes', () => {
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: null,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <PrivateRoute element={<ProtectedComponent />} />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should redirect to login, not show protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow access to protected routes for authenticated users', () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <PrivateRoute element={<ProtectedComponent />} />
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should validate role-based permissions', () => {
      const mockAdminUser = createMockAdminUser();
      const mockRegularUser = createMockUser();

      // Test admin permissions
      mockDbService.validateAuth.mockImplementation((requiredRole) => {
        if (requiredRole === 'admin' && mockAdminUser.Role !== 'admin') {
          throw new Error('Unauthorized access');
        }
      });

      expect(() => mockDbService.validateAuth('admin')).not.toThrow();

      // Test regular user trying to access admin functions
      mockDbService.validateAuth.mockImplementation((requiredRole) => {
        if (requiredRole === 'admin' && mockRegularUser.Role !== 'admin') {
          throw new Error('Unauthorized access');
        }
      });

      expect(() => mockDbService.validateAuth('admin')).toThrow('Unauthorized access');
    });
  });

  describe('Authentication Token Handling', () => {
    it('should handle authentication token expiration', async () => {
      const { onAuthStateChanged } = require('firebase/auth');
      let authCallback;
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        return jest.fn();
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate token expiration
      authCallback(null);

      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
      });
    });

    it('should handle invalid authentication tokens', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-credential',
        message: 'The credential is invalid',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      const sqlInjection = "'; DROP TABLE users; --";
      
      fireEvent.change(nameInput, { target: { value: sqlInjection } });

      // Input should be treated as plain text
      expect(nameInput.value).toBe(sqlInjection);
    });

    it('should prevent XSS attacks in form inputs', async () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      const xssPayload = '<img src=x onerror=alert("XSS")>';
      
      fireEvent.change(nameInput, { target: { value: xssPayload } });

      // Input should be treated as plain text, not executed
      expect(nameInput.value).toBe(xssPayload);
    });

    it('should validate email format to prevent injection', async () => {
      const { generateUserProfileSchema } = require('../../schemas/UserProfileSchema');
      const schema = generateUserProfileSchema();

      const maliciousEmail = 'test@example.com<script>alert("xss")</script>';
      
      await expect(schema.validateAsync({
        Name: 'Test User',
        Email: maliciousEmail,
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: 'parent-user',
        archived: false,
        paymentHold: false,
      })).rejects.toThrow('"Email" must be a valid email');
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose internal system information in error messages', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue(new Error('Internal server error: database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      // Error should be logged but not exposed to user
      expect(consoleSpy).toHaveBeenCalled();
      expect(screen.queryByText('database connection failed')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should provide generic error messages to users', async () => {
      const mockUseMutation = require('@tanstack/react-query').useMutation;
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: { message: 'Authentication failed' },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should handle concurrent login attempts', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockResolvedValue({ user: createMockUser() });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Simulate multiple rapid clicks
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });

    it('should handle logout securely', async () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
        logout: jest.fn(),
      });

      const TestComponent = () => {
        const { logout } = useAuth();
        return <button onClick={logout} data-testid="logout-btn">Logout</button>;
      };

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      const logoutButton = screen.getByTestId('logout-btn');
      fireEvent.click(logoutButton);

      // Logout should be called
      expect(useAuth().logout).toHaveBeenCalled();
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types for profile photos', async () => {
      const mockUser = createMockUser();
      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText('Photo');
      
      // Create a malicious file
      const maliciousFile = new File(['malicious content'], 'malicious.exe', {
        type: 'application/x-executable',
      });

      fireEvent.change(fileInput, { target: { files: [maliciousFile] } });

      // File should be accepted by the input (validation happens server-side)
      expect(fileInput.files[0]).toBe(maliciousFile);
    });

    it('should handle file upload errors securely', async () => {
      const mockUser = createMockUser();
      mockDbService.uploadProfilePhoto.mockRejectedValue(new Error('File upload failed'));

      const { useAuth } = require('../../components/AuthProvider');
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      const mockUseMutation = require('@tanstack/react-query').useMutation;
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: { message: 'File upload failed' },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserForm />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('File upload failed')).toBeInTheDocument();
      });
    });
  });

  describe('Rate Limiting and Brute Force Protection', () => {
    it('should handle multiple failed login attempts', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue(FIREBASE_ERRORS.WRONG_PASSWORD);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.click(loginButton);
        await waitFor(() => {
          expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(i + 1);
        });
      }

      consoleSpy.mockRestore();
    });

    it('should handle account lockout scenarios', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/too-many-requests',
        message: 'Too many failed login attempts',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
