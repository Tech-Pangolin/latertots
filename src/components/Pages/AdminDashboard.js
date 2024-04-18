import { Grid } from '@mui/material';
import React from 'react';
import Calendar from '../Shared/Calendar';

const AdminDashboard = () => {
  const dashboardWidgetStyle = {
    background: 'aliceblue',
    border: '2px solid black',
    padding: '25px',
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <h1>Admin Dashboard</h1>
        <p>Here is where the admin dashboard content will go.</p>
      </Grid>

      {/* Widgets row */}
      <Grid item xs={3} sx={dashboardWidgetStyle}>
        <h2 style={{marginBlockStart: '0'}}>Admin Actions</h2>
        <ul>
          <li>View User Registrations</li>
          <li>View Child Registrations</li>
          <li>View Contact Registrations</li>
        </ul>
      </Grid>
      <Grid item xs={3} sx={dashboardWidgetStyle}>
      <h2 style={{marginBlockStart: '0'}}>Reports</h2>
        <ul>
          <li>View User Report</li>
          <li>View Child Report</li>
          <li>View Contact Report</li>
        </ul>
      </Grid>
      <Grid item xs={3} sx={dashboardWidgetStyle}>
      <h2 style={{marginBlockStart: '0'}}>Settings</h2>
        <ul>
          <li>Manage Users</li>
          <li>Manage Children</li>
          <li>Manage Contacts</li>
        </ul>
      </Grid>
      <Grid item xs={3} sx={dashboardWidgetStyle}>
      <h2 style={{marginBlockStart: '0'}}>System</h2>
        <ul>
          <li>View Logs</li>
          <li>View Errors</li>
          <li>View System Status</li>
        </ul>
      </Grid>

      {/* Calendar row */}
      <Grid item xs={3} sx={dashboardWidgetStyle}>
        <h2 style={{marginBlockStart: '0'}}>Calendar</h2>
        <p>View and manage events on the calendar.</p>
      </Grid> 
      <Grid item xs={9}>
        <Calendar />
      </Grid>


    </Grid>
  );
};

export default AdminDashboard;
