import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Alert from '../../../components/Shared/Alert';

describe('Alert Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders alert with message and dismiss button', () => {
    render(<Alert message="Test message" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('alert-info');
  });

  it('renders different alert types', () => {
    const { rerender } = render(<Alert type="warning" message="Warning" />);
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');

    rerender(<Alert type="danger" message="Danger" />);
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  it('calls onDismiss when close button is clicked', () => {
    const mockOnDismiss = jest.fn();
    render(<Alert message="Test" onDismiss={mockOnDismiss} />);
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after delay', () => {
    const mockOnDismiss = jest.fn();
    render(<Alert message="Test" autoDismissDelayMillis={1000} onDismiss={mockOnDismiss} />);
    
    act(() => jest.advanceTimersByTime(1000));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('does not render when message is empty', () => {
    render(<Alert message="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
