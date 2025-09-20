import React from 'react';
import Alert from './Alert';


const AlertContainer = ({ alerts, removeAlert }) => {
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
