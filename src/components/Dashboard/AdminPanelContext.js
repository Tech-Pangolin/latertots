import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AdminPanelContext = createContext();

export function AdminPanelContextProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [interactionColumnMode, setMode] = useState('notifications'); // 'notifications' or 'daily' view for a selected date

  const value = useMemo(() => ({
    selectedDate,
    setSelectedDate,
    interactionColumnMode,
    setMode,
  }), [selectedDate, interactionColumnMode, setSelectedDate, setMode]);

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