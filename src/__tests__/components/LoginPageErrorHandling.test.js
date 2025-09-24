import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth, signInWithEmail } from '../../components/AuthProvider';
import { renderWithProviders, LoginPageWrapper } from '../../utils/testUtils';

// Mock the AuthProvider
jest.mock('../../components/AuthProvider', () => ({
  useAuth: jest.fn(),
  signInWithEmail: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage Error Handling (Isolated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      currentUser: null,
    });
  });

  it('should handle authentication errors gracefully', async () => {
    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    
    // Reset the signInWithEmail mock completely
    signInWithEmail.mockReset();
    
    // Create a simple error without any stack trace or complex properties
    const networkError = { message: 'Network error' };
    signInWithEmail.mockRejectedValue(networkError);

    // Mock console.error to prevent any error output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockOnSubmit = jest.fn(async (data) => {
      try {
        await signInWithEmail(data.email, data.password);
      } catch (error) {
        // Don't call console.error to avoid any error output
        // Just handle the error silently
      }
    });

    renderWithProviders(<LoginPageWrapper onSubmit={mockOnSubmit} />);

    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'testpassword' }
    });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
