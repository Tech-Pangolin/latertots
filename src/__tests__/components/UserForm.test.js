import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserForm from '../../components/Shared/UserForm';
import { useAuth, signInWithGoogle } from '../../components/AuthProvider';
import { FirebaseDbService } from '../../Helpers/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { generateUserProfileSchema } from '../../schemas/UserProfileSchema';
import { renderWithProviders, createMockUser, createMockFormData, createMockFile, FIREBASE_ERRORS } from '../utils/testUtils';

// Mock dependencies
jest.mock('../../components/AuthProvider', () => ({
  useAuth: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

jest.mock('../../Helpers/firebase', () => ({
  FirebaseDbService: jest.fn().mockImplementation(() => ({
    createUserAndAuthenticate: jest.fn(),
    uploadProfilePhoto: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../../schemas/UserProfileSchema', () => ({
  generateUserProfileSchema: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
    handleSubmit: jest.fn((fn) => (e) => {
      e.preventDefault();
      fn({
        Name: 'Test User',
        Email: 'test@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Test St',
        City: 'Test City',
        State: 'NC',
        Zip: '12345',
        Image: [createMockFile()],
      });
    }),
    formState: { errors: {} },
    reset: jest.fn(),
  })),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../components/Shared/GoogleIcon', () => {
  return function MockGoogleIcon({ size }) {
    return <div data-testid="google-icon" data-size={size}>Google Icon</div>;
  };
});

describe('UserForm', () => {
  let mockDbService;
  let mockUseMutation;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDbService = new FirebaseDbService();
    mockUseMutation = require('@tanstack/react-query').useMutation;
    
    useAuth.mockReturnValue({
      currentUser: null,
    });

    generateUserProfileSchema.mockReturnValue({
      validateAsync: jest.fn().mockResolvedValue({}),
    });
  });

  describe('Registration Mode (Create User)', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        currentUser: null,
      });
    });

    it('should render registration form when user not authenticated', () => {
      renderWithProviders(<UserForm />);

      expect(screen.getByLabelText('Email:')).toBeInTheDocument();
      expect(screen.getByLabelText('Password:')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should validate password confirmation match', async () => {
      renderWithProviders(<UserForm />);

      const passwordInput = screen.getByLabelText('Password:');
      const confirmInput = screen.getByLabelText('Confirm Password:');
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Set different passwords
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'different123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should call createUserAndAuthenticate for new users', async () => {
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        error: null,
      });

      renderWithProviders(<UserForm />);

      const emailInput = screen.getByLabelText('Email:');
      const passwordInput = screen.getByLabelText('Password:');
      const confirmInput = screen.getByLabelText('Confirm Password:');
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDbService.createUserAndAuthenticate).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'password123'
        );
      });
    });

    it('should handle registration errors', async () => {
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Email already in use' },
      });

      renderWithProviders(<UserForm />);

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
      });
    });

    it('should render Google sign-up button', () => {
      renderWithProviders(<UserForm />);

      const googleButton = screen.getByRole('button', { name: /sign up with google/i });
      expect(googleButton).toBeInTheDocument();
      expect(screen.getByTestId('google-icon')).toBeInTheDocument();
    });

    it('should call signInWithGoogle when Google button is clicked', () => {
      renderWithProviders(<UserForm />);

      const googleButton = screen.getByRole('button', { name: /sign up with google/i });
      fireEvent.click(googleButton);

      expect(signInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('Update Mode (Authenticated User)', () => {
    beforeEach(() => {
      const mockUser = createMockUser();
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });
    });

    it('should render update form when user authenticated', () => {
      renderWithProviders(<UserForm />);

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell #')).toBeInTheDocument();
      expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('State')).toBeInTheDocument();
      expect(screen.getByLabelText('Zip')).toBeInTheDocument();
      expect(screen.getByLabelText('Photo')).toBeInTheDocument();
    });

    it('should disable email field in update mode', () => {
      renderWithProviders(<UserForm />);

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeDisabled();
    });

    it('should call updateDoc for existing users', async () => {
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<UserForm />);

      const submitButton = screen.getByRole('button', { name: /update user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should handle file upload for profile photos', async () => {
      const mockFile = createMockFile('profile.jpg', 'image/jpeg');
      mockDbService.uploadProfilePhoto.mockResolvedValue('https://example.com/photo.jpg');

      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<UserForm />);

      const fileInput = screen.getByLabelText('Photo');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const submitButton = screen.getByRole('button', { name: /update user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDbService.uploadProfilePhoto).toHaveBeenCalledWith(
          expect.any(String),
          mockFile
        );
      });
    });

    it('should show validation errors from Joi schema', () => {
      const mockUseForm = require('react-hook-form').useForm;
      mockUseForm.mockReturnValue({
        register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
        handleSubmit: jest.fn((fn) => fn),
        formState: { 
          errors: { 
            Name: { message: 'Name is required' },
            Zip: { message: 'Invalid zip code format' }
          } 
        },
        reset: jest.fn(),
      });

      renderWithProviders(<UserForm />);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid zip code format')).toBeInTheDocument();
    });

    it('should handle update errors', async () => {
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Update failed' },
      });

      renderWithProviders(<UserForm />);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication State Changes', () => {
    it('should redirect authenticated users from registration to profile', () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      const mockUser = createMockUser();
      useAuth.mockReturnValue({
        currentUser: mockUser,
      });

      renderWithProviders(<UserForm />);

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should switch between create and update modes based on authentication', () => {
      const { rerender } = renderWithProviders(<UserForm />);

      // Initially in create mode
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();

      // User becomes authenticated
      useAuth.mockReturnValue({
        currentUser: createMockUser(),
      });
      rerender(<UserForm />);

      expect(screen.getByRole('button', { name: /update user/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate form data with Joi schema', async () => {
      const mockValidateAsync = jest.fn().mockResolvedValue({});
      generateUserProfileSchema.mockReturnValue({
        validateAsync: mockValidateAsync,
      });

      renderWithProviders(<UserForm />);

      const submitButton = screen.getByRole('button', { name: /update user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockValidateAsync).toHaveBeenCalled();
      });
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      const mockValidateAsync = jest.fn().mockRejectedValue(validationError);
      generateUserProfileSchema.mockReturnValue({
        validateAsync: mockValidateAsync,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithProviders(<UserForm />);

      const submitButton = screen.getByRole('button', { name: /update user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockValidateAsync).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', async () => {
      const mockMutate = jest.fn();
      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Network error' },
      });

      renderWithProviders(<UserForm />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle database service initialization errors', () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      // Mock FirebaseDbService constructor to throw error
      FirebaseDbService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      expect(() => renderWithProviders(<UserForm />)).toThrow('Service initialization failed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<UserForm />);

      expect(screen.getByLabelText('Email:')).toBeInTheDocument();
      expect(screen.getByLabelText('Password:')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      renderWithProviders(<UserForm />);

      const emailInput = screen.getByLabelText('Email:');
      const passwordInput = screen.getByLabelText('Password:');
      const confirmInput = screen.getByLabelText('Confirm Password:');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'password');
    });

    it('should have proper button types', () => {
      renderWithProviders(<UserForm />);

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      const googleButton = screen.getByRole('button', { name: /sign up with google/i });

      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(googleButton).toHaveAttribute('type', 'button');
    });
  });
});
