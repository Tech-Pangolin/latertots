import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordForm from '../../components/Pages/ResetPasswordForm';
import { createMockUser, createMockAdminUser } from '../../utils/testUtils';

// Mock AuthProvider functions
jest.mock('../../components/AuthProvider', () => ({
  resetPasswordWithCode: jest.fn(),
  useAuth: jest.fn(),
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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Password Reset Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockImplementation((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() }));
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault();
      fn({ newPassword: 'newpassword123', confirmPassword: 'newpassword123' });
    });
  });

  it('should handle successful password reset for regular user', async () => {
    const mockUser = createMockUser();
    const { resetPasswordWithCode, useAuth } = require('../../components/AuthProvider');
    useAuth.mockReturnValue({ currentUser: mockUser });
    resetPasswordWithCode.mockResolvedValue();

    render(
      <MemoryRouter>
        <ResetPasswordForm oobCode="valid-reset-code" />
      </MemoryRouter>
    );

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    
    await act(async () => {
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      expect(resetPasswordWithCode).toHaveBeenCalledWith('valid-reset-code', 'newpassword123');
    });
  });

  it('should handle successful password reset for admin user', async () => {
    const mockAdminUser = createMockAdminUser();
    const { resetPasswordWithCode, useAuth } = require('../../components/AuthProvider');
    useAuth.mockReturnValue({ currentUser: mockAdminUser });
    resetPasswordWithCode.mockResolvedValue();

    render(
      <MemoryRouter>
        <ResetPasswordForm oobCode="valid-reset-code" />
      </MemoryRouter>
    );

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    
    await act(async () => {
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      expect(resetPasswordWithCode).toHaveBeenCalledWith('valid-reset-code', 'newpassword123');
    });
  });

  it('should handle invalid reset code gracefully', async () => {
    const { resetPasswordWithCode, useAuth } = require('../../components/AuthProvider');
    useAuth.mockReturnValue({ currentUser: null });
    resetPasswordWithCode.mockRejectedValue({ 
      code: 'auth/invalid-action-code',
      message: 'Invalid action code' 
    });

    render(
      <MemoryRouter>
        <ResetPasswordForm oobCode="invalid-code" />
      </MemoryRouter>
    );

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    
    await act(async () => {
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/this reset link is invalid or has expired/i)).toBeInTheDocument();
    });
  });

  it('should handle missing reset code', () => {
    const { useAuth } = require('../../components/AuthProvider');
    useAuth.mockReturnValue({ currentUser: null });

    render(
      <MemoryRouter>
        <ResetPasswordForm oobCode={null} />
      </MemoryRouter>
    );

    expect(screen.getByText(/no valid reset code found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument();
  });
});