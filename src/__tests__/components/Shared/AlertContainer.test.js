import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertContainer from '../../../components/Shared/AlertContainer';
import { useAlerts } from '../../../Hooks/useAlerts';

// Mock the useAlerts hook
jest.mock('../../../Hooks/useAlerts');

// Mock the Alert component
jest.mock('../../../components/Shared/Alert', () => {
  return function MockAlert({ type, message, onDismiss }) {
    return (
      <div data-testid={`alert-${type}`}>
        <span>{message}</span>
        <button onClick={onDismiss} data-testid="dismiss-button">Dismiss</button>
      </div>
    );
  };
});

describe('AlertContainer Component', () => {
  const mockUseAlerts = useAlerts;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders no alerts when alerts array is empty', () => {
    mockUseAlerts.mockReturnValue({ alerts: [], removeAlert: jest.fn() });
    const { container } = render(<AlertContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple alerts and handles dismissal', () => {
    const mockRemoveAlert = jest.fn();
    const mockAlerts = [
      { id: '1', type: 'warning', message: 'Warning message' },
      { id: '2', type: 'info', message: 'Info message' },
    ];

    mockUseAlerts.mockReturnValue({
      alerts: mockAlerts,
      removeAlert: mockRemoveAlert,
    });

    render(<AlertContainer />);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();

    const dismissButtons = screen.getAllByTestId('dismiss-button');
    fireEvent.click(dismissButtons[0]);

    expect(mockRemoveAlert).toHaveBeenCalledWith('1');
  });
});
