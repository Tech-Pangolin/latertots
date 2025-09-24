import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import { renderWithProviders, ChangePasswordFormWrapper } from '../../utils/testUtils';

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(() => ({ type: 'email' })),
  },
}));

// Mock Firebase Auth config
jest.mock('../../config/firebaseAuth', () => ({
  firebaseAuth: {
    currentUser: {
      email: 'test@example.com',
    },
  },
}));

// No need to mock useForm - using real implementation with wrapper

// Mock TanStack Query
const mockMutate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render password change form with all required fields', () => {
    const mockOnSubmit = jest.fn();
    renderWithProviders(<ChangePasswordFormWrapper onSubmit={mockOnSubmit} />);

    expect(screen.getByPlaceholderText('Current Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('should call mutation with form data when submitted', async () => {
    const mockOnSubmit = jest.fn();
    renderWithProviders(<ChangePasswordFormWrapper onSubmit={mockOnSubmit} />);

    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText('Current Password'), {
      target: { value: 'oldpassword123' }
    });
    fireEvent.change(screen.getByPlaceholderText('New Password'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'newpassword123' }
    });

    const submitButton = screen.getByRole('button', { name: /change password/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        },
        expect.any(Object) // The event object
      );
    });
  });

});