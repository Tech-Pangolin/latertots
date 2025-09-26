import React, { useState, useCallback } from 'react';
import DashHome from '../Dashboard/DashHome';
import DashNav from '../Dashboard/DashNav';
import AdminUsers from '../Dashboard/AdminUsers';
import AdminContacts from '../Dashboard/AdminContacts';
import AdminChildren from '../Dashboard/AdminChildren';
import AdminReservations from '../Dashboard/AdminReservations';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  

  // Memoize renderView to prevent child components from unmounting/remounting
  const renderView = useCallback(() => {
    switch (currentView) {
      case 'users':
        return <AdminUsers />;
      case 'children':
        return <AdminChildren />;
      case 'contacts':
        return <AdminContacts />;
      case 'reservations':
        return <AdminReservations />;
      case 'dashboard':
      default:
        return <DashHome />;
    }
  }, [currentView]);

  return (
    <>
      <div className="container-fluid" style={{ borderTop: '1px solid rgb(33, 105, 187)' }}>
        <div className="row">
          <DashNav setCurrentView={setCurrentView} />
          <main className="col-md-10 ml-sm-auto col-lg-10 px-md-4 py-4">
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
};


export default AdminDashboard;
