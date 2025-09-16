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

describe('useAlerts Hook', () => {
  const mockUseLocation = useLocation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/test', state: null });
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
});
