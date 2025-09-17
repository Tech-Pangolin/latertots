import React, { useState } from 'react';
import DashHome from '../Dashboard/DashHome';
import DashNav from '../Dashboard/DashNav';
import AdminUsers from '../Dashboard/AdminUsers';
import AdminContacts from '../Dashboard/AdminContacts';
import AdminChildren from '../Dashboard/AdminChildren';
import AdminReservations from '../Dashboard/AdminReservations';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
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
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light p-3">
        <div className="d-flex col-12 col-md-2 col-lg-2 mb-2 mb-lg-0 flex-wrap flex-md-nowrap justify-content-between">
          <a className="navbar-brand text-secondary" href="#" >
            Admin Dashboard
          </a>
          <button className="navbar-toggler d-md-none collapsed mb-3" type="button" data-toggle="collapse" data-target="#sidebar" aria-controls="sidebar" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <input className="form-control form-control-dark" type="text" placeholder="Search" aria-label="Search" />
        </div>
      </nav>
      <div className="container-fluid">
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
