import React from 'react';
import Alert from './Alert';
import { useAlerts } from '../../Hooks/useAlerts';

/**
 * AlertContainer Component
 * 
 * Renders all active alerts using the useAlerts hook
 * 
 * PLANNED TESTS:
 * 1. Unit Tests:
 *    - Renders multiple alerts when they exist
 *    - Renders no alerts when alerts array is empty
 *    - Each alert has unique key prop
 *    - Alert removal works correctly
 * 
 * 2. Integration Tests:
 *    - Works correctly with useAlerts hook
 *    - Alerts from navigation state are displayed
 *    - Multiple alerts can be displayed simultaneously
 */

const AlertContainer = () => {
  const { alerts, removeAlert } = useAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="alert-container">
      {alerts.map(alert => (
        <div key={alert.id} className="mb-2">
          <Alert
            type={alert.type}
            message={alert.message}
            autoDismissDelayMillis={alert.autoDismissDelayMillis}
            onDismiss={() => removeAlert(alert.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;
