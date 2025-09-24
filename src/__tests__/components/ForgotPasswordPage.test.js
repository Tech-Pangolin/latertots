import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ForgotPasswordPage from '../../components/Pages/ForgotPasswordPage';
import { renderWithProviders } from '../../utils/testUtils';

// Mock AuthProvider functions
jest.mock('../../components/AuthProvider', () => ({
  sendPasswordResetEmailToUser: jest.fn(),
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

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockImplementation((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() }));
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault();
      fn({ email: 'test@example.com' });
    });
  });

  it('should render forgot password form with email field', () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('should call sendPasswordResetEmailToUser with email when form is submitted', async () => {
    const { sendPasswordResetEmailToUser } = require('../../components/AuthProvider');
    sendPasswordResetEmailToUser.mockResolvedValue();
    
    renderWithProviders(<ForgotPasswordPage />);

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(sendPasswordResetEmailToUser).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show same message for security even when email does not exist', async () => {
    const { sendPasswordResetEmailToUser } = require('../../components/AuthProvider');
    sendPasswordResetEmailToUser.mockRejectedValue(new Error('User not found'));
    
    renderWithProviders(<ForgotPasswordPage />);

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/if an account with that email exists, a password reset link has been sent/i)).toBeInTheDocument();
    });
  });
});