import React, { useEffect, useState } from 'react';

const Alert = ({ 
  type = 'info', // info, warning, success, danger
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
