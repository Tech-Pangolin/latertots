import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Creates an alert object with a unique ID
 */
const createAlert = (type, message, autoDismissDelayMillis = null) => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  type,
  message,
  autoDismissDelayMillis
});

/**
 * useAlerts Hook - Manages alerts for a single page/route
 * 
 * This hook supports two alert patterns:
 * 
 * 1. NAVIGATION ALERTS: Alerts passed when navigating to this page
 *    Example:
 *    navigate('/profile', { 
 *      state: { 
 *        alerts: [{ type: 'warning', message: 'Please register a child' }],
 *        switchToTab: 'children' 
 *      } 
 *    })
 * 
 * 2. LOCAL ALERTS: Alerts added within this page
 *    Example:
 *    addAlert('success', 'Profile updated successfully!')
 * 
 * ⚠️  IMPORTANT: Only call this hook ONCE per page in the main page component.
 *    Pass { addAlert } as props to child components that need to add alerts.
 *    Pass { alerts, removeAlert } as props to AlertContainer.
 * 
 * @returns {Object} { alerts, addAlert, removeAlert, clearAllAlerts }
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const location = useLocation();
  const processedAlertsRef = useRef(new Set());
  
  // Development-only usage tracking to prevent multiple calls on same page
  // Use a global variable to track usage across hook instances
  if (typeof window !== 'undefined' && !window.__useAlertsPageUsage) {
    window.__useAlertsPageUsage = new Set();
  }

  // Development warning for multiple hook calls on same page
  if (process.env.NODE_ENV === 'development') {
    const pageKey = location.pathname;
    if (window.__useAlertsPageUsage && window.__useAlertsPageUsage.has(pageKey)) {
      console.warn(
        '⚠️ useAlerts called multiple times on the same page. ' +
        'Only call useAlerts once per page in the main page component. ' +
        'Pass alert functions as props to child components.'
      );
    }
    if (window.__useAlertsPageUsage) {
      window.__useAlertsPageUsage.add(pageKey);
    }
  }

  // Handle alerts from navigation state
  useEffect(() => {
    if (location.state?.alerts && location.state.alerts.length > 0) {
      // Create a unique key for this set of alerts based on pathname and alert content
      const alertKey = `${location.pathname}-${JSON.stringify(location.state.alerts)}`;
      
      // Only process if we haven't already processed these alerts
      if (!processedAlertsRef.current.has(alertKey)) {
        setAlerts(prev => [...prev, ...location.state.alerts]);
        processedAlertsRef.current.add(alertKey);
        
        // Clear the navigation state to prevent re-triggering on refresh
        // and to prevent alerts from carrying over to other pages
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.pathname, location.state?.alerts]);

  // Add a new alert
  const addAlert = (type, message, autoDismissDelayMillis = null) => {
    const newAlert = createAlert(type, message, autoDismissDelayMillis);
    setAlerts(prev => [...prev, newAlert]);
  };

  // Remove a specific alert by ID
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAllAlerts
  };
};
