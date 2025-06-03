import React from 'react';
import { useAdminPanelContext } from './AdminPanelContext';

export default function InteractionColumnNavHeader({children}) {
  const { interactionColumnMode, setMode } = useAdminPanelContext();

  const sectionHeaderText = {
    notifications: 'Notifications',
    daily: 'Daily View',
  };

  return (
    <>
      <h5 className="card-header">{sectionHeaderText[interactionColumnMode]}</h5>
      <div
        className="card-body overflow-auto flex-fill"
        style={{ minHeight: 0 }}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setMode('notifications')}
              disabled={interactionColumnMode === 'notifications'}
              className='btn btn-primary'
            >
              Notifications
            </button>
            
            <button
              onClick={() => setMode('daily')}
              disabled={interactionColumnMode === 'daily'}
              style={{ marginLeft: 8 }}
              className='btn btn-secondary'
            >
              Daily View
            </button>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
