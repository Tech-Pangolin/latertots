import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for managing alerts across pages
 * 
 * Features:
 * - Handles alerts from navigation state
 * - Provides methods to add/remove alerts
 * - Automatically clears navigation state after processing
 * - Supports multiple alerts with unique IDs
 */

const createAlert = (type, message, autoDismissDelayMillis = null) => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  type,
  message,
  autoDismissDelayMillis
});

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const location = useLocation();
  const processedAlertsRef = useRef(new Set());

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
