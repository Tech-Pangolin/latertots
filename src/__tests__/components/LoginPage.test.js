import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../components/Pages/LoginPage';
import { useAuth, signInWithGoogle, signInWithEmail } from '../../components/AuthProvider';
import { renderWithProviders, createMockUser, createMockAdminUser, FIREBASE_ERRORS } from '../utils/testUtils';

// Mock the AuthProvider
jest.mock('../../components/AuthProvider', () => ({
  useAuth: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithEmail: jest.fn(),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      fn({
        email: formData.get('email') || 'test@example.com',
        password: formData.get('password') || 'testpassword',
      });
    }),
    formState: { errors: {} },
  })),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock GoogleIcon component
jest.mock('../../components/Shared/GoogleIcon', () => {
  return function MockGoogleIcon({ size }) {
    return <div data-testid="google-icon" data-size={size}>Google Icon</div>;
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      currentUser: null,
    });
  });

  describe('Rendering', () => {
    it('should render login form with email and password fields', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render Google sign-in button', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderWithProviders(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should render background image and logo', () => {
      renderWithProviders(<LoginPage />);

      const container = screen.getByRole('main') || document.querySelector('.container-fluid');
      expect(container).toHaveStyle({
        background: "url('assets/img/login/loginbg.png')",
        backgroundSize: 'cover',
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', () => {
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

      renderWithProviders(<LoginPage />);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should not show validation errors when fields are valid', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call signInWithEmail with form data on submit', async () => {
      const mockHandleSubmit = jest.fn((fn) => (e) => {
        e.preventDefault();
        fn({ email: 'test@example.com', password: 'testpassword' });
      });

      const mockUseForm = require('react-hook-form').useForm;
      mockUseForm.mockReturnValue({
        register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
        handleSubmit: mockHandleSubmit,
        formState: { errors: {} },
      });

      renderWithProviders(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'testpassword');
      });
    });

    it('should handle form submission errors', async () => {
      signInWithEmail.mockRejectedValue(FIREBASE_ERRORS.WRONG_PASSWORD);

      const mockHandleSubmit = jest.fn((fn) => (e) => {
        e.preventDefault();
        fn({ email: 'test@example.com', password: 'wrongpassword' });
      });

      const mockUseForm = require('react-hook-form').useForm;
      mockUseForm.mockReturnValue({
        register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
        handleSubmit: mockHandleSubmit,
        formState: { errors: {} },
      });

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Google Sign-in', () => {
    it('should call signInWithGoogle when Google button is clicked', () => {
      renderWithProviders(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);

      expect(signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle Google sign-in errors', async () => {
      signInWithGoogle.mockRejectedValue(FIREBASE_ERRORS.USER_NOT_FOUND);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signInWithGoogle).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User Authentication State', () => {
    it('should redirect admin users to /admin', () => {
      const mockAdminUser = createMockAdminUser();
      useAuth.mockReturnValue({
        currentUser: mockAdminUser,
      });

      renderWithProviders(<LoginPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should redirect regular users to /profile', () => {
      const mockUser = createMockUser();
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      renderWithProviders(<LoginPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should not redirect when no user is authenticated', () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderWithProviders(<LoginPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle user role changes', () => {
      const { rerender } = renderWithProviders(<LoginPage />);

      // Initially no user
      expect(mockNavigate).not.toHaveBeenCalled();

      // User logs in as regular user
      useAuth.mockReturnValue({
        currentUser: createMockUser(),
      });
      rerender(<LoginPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');

      // User role changes to admin
      useAuth.mockReturnValue({
        currentUser: createMockAdminUser(),
      });
      rerender(<LoginPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when register link is clicked', () => {
      renderWithProviders(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      renderWithProviders(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      expect(loginButton).toHaveAttribute('type', 'submit');
      expect(googleButton).toHaveAttribute('type', 'button');
    });

    it('should have proper input types', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      signInWithEmail.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockHandleSubmit = jest.fn((fn) => (e) => {
        e.preventDefault();
        fn({ email: 'test@example.com', password: 'testpassword' });
      });

      const mockUseForm = require('react-hook-form').useForm;
      mockUseForm.mockReturnValue({
        register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
        handleSubmit: mockHandleSubmit,
        formState: { errors: {} },
      });

      renderWithProviders(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
