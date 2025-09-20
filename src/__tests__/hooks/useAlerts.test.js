import { renderHook, act } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { useAlerts } from '../../Hooks/useAlerts';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

// Mock window.history.replaceState
const mockReplaceState = jest.fn();
Object.defineProperty(window, 'history', {
  value: { replaceState: mockReplaceState },
  writable: true,
});

// Mock console.warn to capture warnings
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

describe('useAlerts Hook', () => {
  const mockUseLocation = useLocation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/test', state: null });
    console.warn = mockConsoleWarn;
    // Clear the global usage tracking
    if (typeof window !== 'undefined') {
      window.__useAlertsPageUsage = new Set();
    }
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    // Clear the global usage tracking
    if (typeof window !== 'undefined') {
      window.__useAlertsPageUsage = new Set();
    }
  });

  it('processes alerts from navigation state', () => {
    const mockAlerts = [{ id: '1', type: 'warning', message: 'Test warning' }];
    mockUseLocation.mockReturnValue({
      pathname: '/profile',
      state: { alerts: mockAlerts },
    });

    const { result } = renderHook(() => useAlerts());

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(mockReplaceState).toHaveBeenCalled();
  });

  it('adds and removes alerts', () => {
    const { result } = renderHook(() => useAlerts());

    act(() => {
      result.current.addAlert('warning', 'Test message');
    });

    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].type).toBe('warning');
    expect(result.current.alerts[0].message).toBe('Test message');

    const alertId = result.current.alerts[0].id;
    act(() => {
      result.current.removeAlert(alertId);
    });

    expect(result.current.alerts).toHaveLength(0);
  });

  it('does not process alerts when none exist', () => {
    mockUseLocation.mockReturnValue({ pathname: '/profile', state: null });
    const { result } = renderHook(() => useAlerts());

    expect(result.current.alerts).toEqual([]);
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  describe('Development Warnings', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      // Set NODE_ENV to development to enable warnings
      process.env.NODE_ENV = 'development';
      // Clear the global usage tracking for each test
      if (typeof window !== 'undefined') {
        window.__useAlertsPageUsage = new Set();
      }
    });

    afterEach(() => {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
      // Clear the global usage tracking
      if (typeof window !== 'undefined') {
        window.__useAlertsPageUsage = new Set();
      }
    });

    it('warns when useAlerts is called multiple times on the same page', () => {
      const pathname = '/profile';
      mockUseLocation.mockReturnValue({ pathname, state: null });

      // First call - should not warn
      const { result: firstResult } = renderHook(() => useAlerts());
      expect(mockConsoleWarn).not.toHaveBeenCalled();

      // Second call on same page - should warn
      const { result: secondResult } = renderHook(() => useAlerts());
      
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️ useAlerts called multiple times on the same page. ' +
        'Only call useAlerts once per page in the main page component. ' +
        'Pass alert functions as props to child components.'
      );
    });

    it('does not warn when useAlerts is called on different pages', () => {
      // First call on /profile
      mockUseLocation.mockReturnValue({ pathname: '/profile', state: null });
      const { result: firstResult } = renderHook(() => useAlerts());
      expect(mockConsoleWarn).not.toHaveBeenCalled();

      // Second call on /schedule - should not warn (different page)
      mockUseLocation.mockReturnValue({ pathname: '/schedule', state: null });
      const { result: secondResult } = renderHook(() => useAlerts());
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('does not warn in production environment', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';
      
      const pathname = '/profile';
      mockUseLocation.mockReturnValue({ pathname, state: null });

      // Multiple calls should not warn in production
      const { result: firstResult } = renderHook(() => useAlerts());
      const { result: secondResult } = renderHook(() => useAlerts());
      
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });
});
