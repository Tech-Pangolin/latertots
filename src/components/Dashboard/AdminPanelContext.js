import React, { createContext, useContext, useEffect, useState } from 'react';

const AdminPanelContext = createContext();

export function AdminPanelContextProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [interactionColumnMode, setMode] = useState('notifications'); // 'notifications' or 'daily' view for a selected date

  const value = {
    selectedDate,
    setSelectedDate,
    interactionColumnMode,
    setMode,
  };

  useEffect(() => {
    if (selectedDate != null) {
      setMode('daily')
    }
  }, [selectedDate]);

  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  );
}

export function useAdminPanelContext() {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error(
      'useAdminPanelContext must be used within an AdminPanelContextProvider'
    );
  }
  return context;
}