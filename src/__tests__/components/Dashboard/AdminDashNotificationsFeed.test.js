import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashNotificationsFeed from '../../../components/Dashboard/AdminDashNotificationsFeed';
import { useNotificationsRQ } from '../../../Hooks/query-related/useNotificationsRQ';

// Mock the useNotificationsRQ hook
jest.mock('../../../Hooks/query-related/useNotificationsRQ', () => ({
  useNotificationsRQ: jest.fn(),
}));

// Mock AdminNotificationCard component
jest.mock('../../../components/Dashboard/AdminNotificationCard', () => {
  return function MockAdminNotificationCard({ notification }) {
    return (
      <div data-testid={`notification-card-${notification.id}`}>
        {notification.message}
      </div>
    );
  };
});

describe('AdminDashNotificationsFeed Component', () => {
  const mockNotifications = [
    {
      id: '1',
      message: 'New reservation request for John Doe',
      type: 'admin',
      isAdminMessage: true,
      createdAt: { toDate: () => new Date() },
    },
    {
      id: '2',
      message: 'User account locked due to payment hold',
      type: 'admin',
      isAdminMessage: true,
      createdAt: { toDate: () => new Date() },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Loading State', () => {
    it('should show loading message when data is loading', () => {
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when there is an error', () => {
      const mockError = new Error('Failed to fetch notifications');
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByText('Error loading notifications: Failed to fetch notifications')).toBeInTheDocument();
    });

    it('should show generic error message when error has no message', () => {
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: {},
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByText('Error loading notifications: Unknown error')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no notifications exist', () => {
      useNotificationsRQ.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByText('No notifications at this time')).toBeInTheDocument();
    });

    it('should show empty message when notifications is null', () => {
      useNotificationsRQ.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByText('No notifications at this time')).toBeInTheDocument();
    });
  });

  describe('Notifications Display', () => {
    it('should render notification cards when notifications exist', () => {
      useNotificationsRQ.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-card-2')).toBeInTheDocument();
      expect(screen.getByText('New reservation request for John Doe')).toBeInTheDocument();
      expect(screen.getByText('User account locked due to payment hold')).toBeInTheDocument();
    });

    it('should render all notification cards with correct props', () => {
      useNotificationsRQ.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      // Check that both notification cards are rendered
      const notificationCards = screen.getAllByTestId(/notification-card-/);
      expect(notificationCards).toHaveLength(2);
    });

    it('should handle single notification correctly', () => {
      const singleNotification = [mockNotifications[0]];
      
      useNotificationsRQ.mockReturnValue({
        data: singleNotification,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-card-2')).not.toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to displaying notifications', async () => {
      // Initial loading state
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { rerender } = render(<AdminDashNotificationsFeed />);
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();

      // Transition to loaded state
      useNotificationsRQ.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
      });

      rerender(<AdminDashNotificationsFeed />);
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument();
    });

    it('should transition from loading to error state', async () => {
      // Initial loading state
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { rerender } = render(<AdminDashNotificationsFeed />);
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();

      // Transition to error state
      const mockError = new Error('Network error');
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      rerender(<AdminDashNotificationsFeed />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading notifications: Network error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument();
    });

    it('should transition from loading to empty state', async () => {
      // Initial loading state
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { rerender } = render(<AdminDashNotificationsFeed />);
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();

      // Transition to empty state
      useNotificationsRQ.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      rerender(<AdminDashNotificationsFeed />);
      
      await waitFor(() => {
        expect(screen.getByText('No notifications at this time')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render with proper Material-UI Alert for error state', () => {
      const mockError = new Error('Test error');
      useNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      render(<AdminDashNotificationsFeed />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveClass('MuiAlert-standardError');
    });

    it('should render with proper Typography for loading and empty states', () => {
      useNotificationsRQ.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<AdminDashNotificationsFeed />);

      const emptyMessage = screen.getByText('No notifications at this time');
      expect(emptyMessage).toHaveClass('MuiTypography-body1');
    });
  });
});
