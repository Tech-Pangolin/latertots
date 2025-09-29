import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashNotificationsFeed from '../../components/Dashboard/AdminDashNotificationsFeed';
import AdminNotificationCard from '../../components/Dashboard/AdminNotificationCard';
import { useAuth } from '../../components/AuthProvider';
import { createMockUser, createMockAdminUser, renderWithProviders } from '../../utils/testUtils';

// Mock the AuthProvider
jest.mock('../../components/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

// Mock logger
jest.mock('../../Helpers/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock constants
jest.mock('../../Helpers/constants', () => ({
  COLLECTIONS: {
    NOTIFICATIONS: 'Notifications',
  },
  NOTIFICATION_TYPES: {
    ADMIN: 'admin',
    SYSTEM: 'system',
  },
}));

// Mock Firestore config
jest.mock('../../config/firestore', () => ({
  db: {},
}));

// Mock the useNotificationsRQ hook for integration tests
jest.mock('../../Hooks/query-related/useNotificationsRQ', () => ({
  useNotificationsRQ: jest.fn(),
}));

describe('NotificationFlow Integration Tests', () => {
  let mockDbService;
  let mockUnsubscribe;
  let mockDismissNotification;
  let mockUseNotificationsRQ;

  const createWrapper = () => {
    return ({ children }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    mockDismissNotification = jest.fn();
    mockDbService = {
      fetchDocs: jest.fn(),
      subscribeDocs: jest.fn().mockReturnValue(mockUnsubscribe),
    };

    useAuth.mockReturnValue({
      dbService: mockDbService,
      currentUser: createMockAdminUser(),
    });

    // Get reference to the mocked hook
    const { useNotificationsRQ } = require('../../Hooks/query-related/useNotificationsRQ');
    mockUseNotificationsRQ = useNotificationsRQ;
    mockUseNotificationsRQ.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Complete Notification Flow', () => {
    it('should fetch, display, and dismiss notifications for admin users', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          message: 'New reservation request for John Doe',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
        },
        {
          id: 'notification-2',
          message: 'User account locked due to payment hold',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date('2024-01-15T11:00:00Z') },
        },
      ];

      // Mock the hook to return the notifications and dismiss function
      mockUseNotificationsRQ.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      const { unmount } = render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      // Verify notifications are displayed
      await waitFor(() => {
        expect(screen.getByText('New reservation request for John Doe')).toBeInTheDocument();
        expect(screen.getByText('User account locked due to payment hold')).toBeInTheDocument();
      });

      // Verify dismiss buttons are present
      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      expect(dismissButtons).toHaveLength(2);

      // Test dismissing a notification
      fireEvent.click(dismissButtons[0]);
      expect(mockDismissNotification).toHaveBeenCalledWith('notification-1');

      // Clean up
      unmount();
    });

    it('should handle real-time updates when notifications change', async () => {
      const initialNotifications = [
        {
          id: 'notification-1',
          message: 'Initial notification',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      const updatedNotifications = [
        ...initialNotifications,
        {
          id: 'notification-2',
          message: 'New notification added',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      // Start with initial notifications
      mockUseNotificationsRQ.mockReturnValue({
        data: initialNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      const { rerender, unmount } = render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      // Verify initial notification is displayed
      await waitFor(() => {
        expect(screen.getByText('Initial notification')).toBeInTheDocument();
      });

      // Simulate real-time update
      mockUseNotificationsRQ.mockReturnValue({
        data: updatedNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      rerender(<AdminDashNotificationsFeed />);

      // Verify both notifications are now displayed
      await waitFor(() => {
        expect(screen.getByText('Initial notification')).toBeInTheDocument();
        expect(screen.getByText('New notification added')).toBeInTheDocument();
      });

      // Clean up
      unmount();
    });
  });

  describe('Role-based Notification Visibility', () => {
    it('should show admin notifications for admin users', async () => {
      const adminNotifications = [
        {
          id: 'admin-notification-1',
          message: 'Admin-only notification',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      useAuth.mockReturnValue({
        dbService: mockDbService,
        currentUser: createMockAdminUser(),
      });

      mockUseNotificationsRQ.mockReturnValue({
        data: adminNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin-only notification')).toBeInTheDocument();
      });
    });

    it('should show user notifications for regular users', async () => {
      const userNotifications = [
        {
          id: 'user-notification-1',
          message: 'User-specific notification',
          type: 'system',
          isAdminMessage: false,
          userId: 'user-123',
          createdAt: { toDate: () => new Date() },
        },
      ];

      useAuth.mockReturnValue({
        dbService: mockDbService,
        currentUser: createMockUser(),
      });

      mockUseNotificationsRQ.mockReturnValue({
        data: userNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('User-specific notification')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Card Integration', () => {
    it('should render notification cards with correct props and styling', async () => {
      const mockNotification = {
        id: 'test-notification',
        message: 'Test notification message',
        type: 'admin',
        isAdminMessage: true,
        createdAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
      };

      mockUseNotificationsRQ.mockReturnValue({
        data: [mockNotification],
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      render(<AdminNotificationCard notification={mockNotification} />, { wrapper: createWrapper() });

      // Verify all elements are rendered correctly
      expect(screen.getByText('Test notification message')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('🔔')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('should handle dismiss functionality with loading states', async () => {
      const mockNotification = {
        id: 'test-notification',
        message: 'Test notification message',
        type: 'admin',
        isAdminMessage: true,
        createdAt: { toDate: () => new Date() },
      };

      // Start with not dismissing
      mockUseNotificationsRQ.mockReturnValue({
        data: [mockNotification],
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      const { rerender } = render(<AdminNotificationCard notification={mockNotification} />, { wrapper: createWrapper() });

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).not.toBeDisabled();

      // Click dismiss
      fireEvent.click(dismissButton);
      expect(mockDismissNotification).toHaveBeenCalledWith('test-notification');

      // Simulate dismissing state
      mockUseNotificationsRQ.mockReturnValue({
        data: [mockNotification],
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: true,
        dismissError: null,
      });

      rerender(<AdminNotificationCard notification={mockNotification} />);

      expect(screen.getByText('Dismissing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismissing/i })).toBeDisabled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Failed to fetch notifications');
      
      mockUseNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Error loading notifications: Failed to fetch notifications')).toBeInTheDocument();
      });
    });

    it('should handle dismiss errors gracefully', async () => {
      const mockNotification = {
        id: 'test-notification',
        message: 'Test notification message',
        type: 'admin',
        isAdminMessage: true,
        createdAt: { toDate: () => new Date() },
      };

      const dismissError = new Error('Failed to dismiss notification');
      
      mockUseNotificationsRQ.mockReturnValue({
        data: [mockNotification],
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: dismissError,
      });

      render(<AdminNotificationCard notification={mockNotification} />, { wrapper: createWrapper() });

      // The component should still render normally even with a dismiss error
      expect(screen.getByText('Test notification message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('should properly manage loading states across components', async () => {
      // Test loading state
      mockUseNotificationsRQ.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      const { rerender } = render(<AdminDashNotificationsFeed />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();

      // Test loaded state
      const mockNotifications = [
        {
          id: 'notification-1',
          message: 'Loaded notification',
          type: 'admin',
          isAdminMessage: true,
          createdAt: { toDate: () => new Date() },
        },
      ];

      mockUseNotificationsRQ.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        isError: false,
        error: null,
        dismissNotification: mockDismissNotification,
        isDismissing: false,
        dismissError: null,
      });

      rerender(<AdminDashNotificationsFeed />);

      await waitFor(() => {
        expect(screen.getByText('Loaded notification')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument();
    });
  });
});
