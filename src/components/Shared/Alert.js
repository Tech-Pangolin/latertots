import React, { useEffect, useState } from 'react';

/**
 * Reusable Alert Component
 * 
 * Props:
 * - type: Alert type - accepts 'info', 'warning', 'success', or 'danger' (default: 'info')
 * - message: Alert message text to display
 * - autoDismissDelayMillis: Auto-dismiss delay in milliseconds (optional - if not provided, alert only dismisses manually)
 * - onDismiss: Callback function called when alert is dismissed (optional)
 * - className: Additional CSS classes (optional)
 * 
 * PLANNED TESTS:
 * 1. Unit Tests:
 *    - Renders with only predefined alert types (info, warning, success, danger)
 *    - Dismiss button removes component when clicked
 *    - Auto-dismiss functionality works after specified timeout
 * 
 * 2. Integration Tests:
 *    - Works correctly when data is passed in from navigation state
 *    - Multiple alerts can be displayed simultaneously
 */

const Alert = ({ 
  type = 'info', 
  message, 
  autoDismissDelayMillis,
  onDismiss,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss functionality
  useEffect(() => {
    if (autoDismissDelayMillis) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, autoDismissDelayMillis);

      return () => clearTimeout(timer);
    }
  }, [autoDismissDelayMillis, onDismiss]);

  // Handle dismiss button click
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  // Map type to Bootstrap alert class
  const getAlertClass = () => {
    // 'baseClass typeClass dismissibleClass className'
    return `alert alert-${type} alert-dismissible ${className}`.trim();
  };

  if (!message || !isVisible) {
    return null;
  }

  return (
    <div 
      className={getAlertClass()} 
      role="alert"
      aria-live="polite"
    >
      {message}
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={handleDismiss}
      />
    </div>
  );
};

export default Alert;
