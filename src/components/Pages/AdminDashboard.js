import React, { useState } from 'react';
import DashHome from '../Dashboard/DashHome';
import DashNav from '../Dashboard/DashNav';
import AdminUsers from '../Dashboard/AdminUsers';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const dashboardWidgetStyle = {
    background: 'aliceblue',
    border: '2px solid black',
    padding: '25px',
  }

  const renderView = () => {
    switch (currentView) {
      case 'users':
        return <AdminUsers />;
      case 'children':
        return <h1>Children</h1>;
      case 'contacts':
        return <h1>Contacts</h1>;
      case 'dashboard':
      default:
        return <DashHome />;
    }
  };

  return (
    <>
      <nav className="navbar navbar-light bg-light p-3">
        <div className="d-flex col-12 col-md-3 col-lg-2 mb-2 mb-lg-0 flex-wrap flex-md-nowrap justify-content-between">
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
          <main className="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
};
{/* // <Grid container>
    //   <Grid item xs={12}>
    //     <h1>Admin Dashboard</h1>
    //     <p>Here is where the admin dashboard content will go.</p>
    //   </Grid>

    //   <Grid item xs={3} sx={dashboardWidgetStyle}>
    //     <h2 style={{marginBlockStart: '0'}}>Admin Actions</h2>
    //     <ul>
    //       <li>View User Registrations</li>
    //       <li>View Child Registrations</li>
    //       <li>View Contact Registrations</li>
    //     </ul>
    //   </Grid>
    //   <Grid item xs={3} sx={dashboardWidgetStyle}>
    //   <h2 style={{marginBlockStart: '0'}}>Reports</h2>
    //     <ul>
    //       <li>View User Report</li>
    //       <li>View Child Report</li>
    //       <li>View Contact Report</li>
    //     </ul>
    //   </Grid>
    //   <Grid item xs={3} sx={dashboardWidgetStyle}>
    //   <h2 style={{marginBlockStart: '0'}}>Settings</h2>
    //     <ul>
    //       <li>Manage Users</li>
    //       <li>Manage Children</li>
    //       <li>Manage Contacts</li>
    //     </ul>
    //   </Grid>
    //   <Grid item xs={3} sx={dashboardWidgetStyle}>
    //   <h2 style={{marginBlockStart: '0'}}>System</h2>
    //     <ul>
    //       <li>View Logs</li>
    //       <li>View Errors</li>
    //       <li>View System Status</li>
    //     </ul>
    //   </Grid>

    //   <Grid item xs={3} sx={dashboardWidgetStyle}>
    //     <h2 style={{marginBlockStart: '0'}}>Calendar</h2>
    //     <p>View and manage events on the calendar.</p>
    //   </Grid> 
    //   <Grid item xs={9}>
    //     <Calendar />
    //   </Grid>


    // </Grid> */}


export default AdminDashboard;
