import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminNotificationCard from '../../../components/Dashboard/AdminNotificationCard';
import { useNotificationsRQ } from '../../../Hooks/query-related/useNotificationsRQ';

// Mock the useNotificationsRQ hook
jest.mock('../../../Hooks/query-related/useNotificationsRQ', () => ({
  useNotificationsRQ: jest.fn(),
}));

// Mock constants
jest.mock('../../../Helpers/constants', () => ({
  NOTIFICATION_TYPES: {
    ADMIN: 'admin',
    SYSTEM: 'system',
  },
}));

describe('AdminNotificationCard Component', () => {
  const mockDismissNotification = jest.fn();
  const mockNotification = {
    id: 'test-notification-123',
    message: 'New reservation request for John Doe',
    type: 'admin',
    isAdminMessage: true,
    createdAt: {
      toDate: () => new Date('2024-01-15T10:30:00Z'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationsRQ.mockReturnValue({
      dismissNotification: mockDismissNotification,
      isDismissing: false,
      dismissError: null,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render notification message correctly', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByText('New reservation request for John Doe')).toBeInTheDocument();
    });

    it('should render notification type chip', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should render formatted date', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      // The date should be formatted as MM/DD/YYYY HH:MM AM/PM
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('should render dismiss button', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should render correct icon for admin notifications', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });

    it('should render correct icon for system notifications', () => {
      const systemNotification = {
        ...mockNotification,
        type: 'system',
      };

      render(<AdminNotificationCard notification={systemNotification} />);

      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('should render default icon for unknown notification types', () => {
      const unknownNotification = {
        ...mockNotification,
        type: 'unknown',
      };

      render(<AdminNotificationCard notification={unknownNotification} />);

      expect(screen.getByText('📢')).toBeInTheDocument();
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call dismissNotification when dismiss button is clicked', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(mockDismissNotification).toHaveBeenCalledWith('test-notification-123');
    });

    it('should show dismissing state when mutation is pending', () => {
      useNotificationsRQ.mockReturnValue({
        dismissNotification: mockDismissNotification,
        isDismissing: true,
        dismissError: null,
      });

      render(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByText('Dismissing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismissing/i })).toBeDisabled();
    });

    it('should disable dismiss button when dismissing', () => {
      useNotificationsRQ.mockReturnValue({
        dismissNotification: mockDismissNotification,
        isDismissing: true,
        dismissError: null,
      });

      render(<AdminNotificationCard notification={mockNotification} />);

      const dismissButton = screen.getByRole('button', { name: /dismissing/i });
      expect(dismissButton).toBeDisabled();
    });
  });

  describe('Date Formatting', () => {
    it('should handle timestamp with toDate method', () => {
      const notificationWithTimestamp = {
        ...mockNotification,
        createdAt: {
          toDate: () => new Date('2024-03-20T14:45:30Z'),
        },
      };

      render(<AdminNotificationCard notification={notificationWithTimestamp} />);

      expect(screen.getByText(/3\/20\/2024/)).toBeInTheDocument();
    });

    it('should handle regular Date object', () => {
      const notificationWithDate = {
        ...mockNotification,
        createdAt: new Date('2024-05-10T09:15:00Z'),
      };

      render(<AdminNotificationCard notification={notificationWithDate} />);

      expect(screen.getByText(/5\/10\/2024/)).toBeInTheDocument();
    });

    it('should handle missing createdAt gracefully', () => {
      const notificationWithoutDate = {
        ...mockNotification,
        createdAt: null,
      };

      render(<AdminNotificationCard notification={notificationWithoutDate} />);

      // Should not crash and should render the rest of the component
      expect(screen.getByText('New reservation request for John Doe')).toBeInTheDocument();
    });
  });

  describe('Notification Type Styling', () => {
    it('should apply correct color for admin notifications', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      const typeChip = screen.getByText('admin');
      // Check for the parent chip element with the correct color class
      const chipElement = typeChip.closest('.MuiChip-root');
      expect(chipElement).toHaveClass('MuiChip-outlinedPrimary');
    });

    it('should apply correct color for system notifications', () => {
      const systemNotification = {
        ...mockNotification,
        type: 'system',
      };

      render(<AdminNotificationCard notification={systemNotification} />);

      const typeChip = screen.getByText('system');
      // Check for the parent chip element with the correct color class
      const chipElement = typeChip.closest('.MuiChip-root');
      expect(chipElement).toHaveClass('MuiChip-outlinedSecondary');
    });
  });

  describe('Card Styling', () => {
    it('should render with correct Material-UI Card structure', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      // Check for Card components
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
      
      // Check for Avatar with icon
      expect(screen.getByText('🔔')).toBeInTheDocument();
      
      // Check for Typography components
      expect(screen.getByText('New reservation request for John Doe')).toBeInTheDocument();
    });

    it('should have hover effects applied', () => {
      render(<AdminNotificationCard notification={mockNotification} />);

      const card = screen.getByText('New reservation request for John Doe').closest('.MuiCard-root');
      expect(card).toHaveStyle({
        transition: 'all 0.2s ease-in-out',
      });
    });
  });
});
