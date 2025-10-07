import React, { useState, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { Navigate } from 'react-router-dom';
import DashHome from '../Dashboard/DashHome';
import DashNav from '../Dashboard/DashNav';
import AdminUsers from '../Dashboard/AdminUsers';
import AdminContacts from '../Dashboard/AdminContacts';
import AdminChildren from '../Dashboard/AdminChildren';
import AdminReservations from '../Dashboard/AdminReservations';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Single admin role validation for the entire dashboard
  const isAdmin = currentUser?.Role === 'admin';

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

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

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
