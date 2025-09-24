import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertContainer from '../../../components/Shared/AlertContainer';

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders no alerts when alerts array is empty', () => {
    const { container } = render(
      <AlertContainer alerts={[]} removeAlert={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple alerts and handles dismissal', () => {
    const mockRemoveAlert = jest.fn();
    const mockAlerts = [
      { id: '1', type: 'warning', message: 'Warning message' },
      { id: '2', type: 'info', message: 'Info message' },
    ];

    render(
      <AlertContainer alerts={mockAlerts} removeAlert={mockRemoveAlert} />
    );

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();

    const dismissButtons = screen.getAllByTestId('dismiss-button');
    fireEvent.click(dismissButtons[0]);

    expect(mockRemoveAlert).toHaveBeenCalledWith('1');
  });
});
