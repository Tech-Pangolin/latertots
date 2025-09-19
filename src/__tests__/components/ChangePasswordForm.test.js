import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import { renderWithProviders } from '../utils/testUtils';

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

// Mock react-hook-form
const mockRegister = jest.fn();
const mockHandleSubmit = jest.fn();
const mockReset = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: {} },
    reset: mockReset,
  }),
}));

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
    mockRegister.mockImplementation((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() }));
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault();
      fn({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
    });
  });

  it('should render password change form with all required fields', () => {
    renderWithProviders(<ChangePasswordForm />);

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('should call mutation with form data when submitted', async () => {
    renderWithProviders(<ChangePasswordForm />);

    const submitButton = screen.getByRole('button', { name: /change password/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
    });
  });

});