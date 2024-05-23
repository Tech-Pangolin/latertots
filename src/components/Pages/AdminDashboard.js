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
        <div className="col-12 col-md-5 col-lg-8 d-flex align-items-center justify-content-md-end mt-3 mt-md-0">
            <div className="mr-3 mt-1">
                <a className="github-button" href="https://github.com/themesberg/simple-bootstrap-5-dashboard" data-color-scheme="no-preference: dark; light: light; dark: light;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star /themesberg/simple-bootstrap-5-dashboard">Star</a>
            </div>
            <div className="dropdown">
                <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-expanded="false">
                  Hello, John Doe
                </button>
                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <li><a className="dropdown-item" href="#">Settings</a></li>
                  <li><a className="dropdown-item" href="#">Messages</a></li>
                  <li><a className="dropdown-item" href="#">Sign out</a></li>
                </ul>
              </div>
        </div>
    </nav>
    <div className="container-fluid">
        <div className="row">
            <nav id="sidebar" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                <div className="position-sticky">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                          <a className="nav-link active" aria-current="page" href="#">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> */}
                            <span className="ml-2">Users</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="nav-link" href="#">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-file"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> */}
                            <span className="ml-2">Children</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="nav-link" href="#">
                            {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> */}
                            <span className="ml-2">Contacts</span>
                          </a>
                        </li>
                        
                      </ul>
                </div>
            </nav>
            <main className="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
                <h1 className="h2">Dashboard</h1>
                <p>This is the homepage of a simple admin interface which is part of a tutorial written on Themesberg</p>
                <div className="row my-4">
                    <div className="col-12 col-md-6 col-lg-3 mb-4 mb-lg-0">
                        <div className="card">
                            <h5 className="card-header">Customers</h5>
                            <div className="card-body">
                              <h5 className="card-title">345k</h5>
                              <p className="card-text">Feb 1 - Apr 1, United States</p>
                              <p className="card-text text-success">18.2% increase since last month</p>
                            </div>
                          </div>
                    </div>
                    <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
                        <div className="card">
                            <h5 className="card-header">Revenue</h5>
                            <div className="card-body">
                              <h5 className="card-title">$2.4k</h5>
                              <p className="card-text">Feb 1 - Apr 1, United States</p>
                              <p className="card-text text-success">4.6% increase since last month</p>
                            </div>
                          </div>
                    </div>
                    <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
                        <div className="card">
                            <h5 className="card-header">Purchases</h5>
                            <div className="card-body">
                              <h5 className="card-title">43</h5>
                              <p className="card-text">Feb 1 - Apr 1, United States</p>
                              <p className="card-text text-danger">2.6% decrease since last month</p>
                            </div>
                          </div>
                    </div>
                    <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
                        <div className="card">
                            <h5 className="card-header">Traffic</h5>
                            <div className="card-body">
                              <h5 className="card-title">64k</h5>
                              <p className="card-text">Feb 1 - Apr 1, United States</p>
                              <p className="card-text text-success">2.5% increase since last month</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12 col-xl-8 mb-4 mb-lg-0">
                        <div className="card">
                            <h5 className="card-header">Latest transactions</h5>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                          <tr>
                                            <th scope="col">Order</th>
                                            <th scope="col">Product</th>
                                            <th scope="col">Customer</th>
                                            <th scope="col">Total</th>
                                            <th scope="col">Date</th>
                                            <th scope="col"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <th scope="row">17371705</th>
                                            <td>Volt Premium Bootstrap 5 Dashboard</td>
                                            <td>johndoe@gmail.com</td>
                                            <td>€61.11</td>
                                            <td>Aug 31 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                          <tr>
                                            <th scope="row">17370540</th>
                                            <td>Pixel Pro Premium Bootstrap UI Kit</td>
                                            <td>jacob.monroe@company.com</td>
                                            <td>$153.11</td>
                                            <td>Aug 28 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                          <tr>
                                            <th scope="row">17371705</th>
                                            <td>Volt Premium Bootstrap 5 Dashboard</td>
                                            <td>johndoe@gmail.com</td>
                                            <td>€61.11</td>
                                            <td>Aug 31 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                          <tr>
                                            <th scope="row">17370540</th>
                                            <td>Pixel Pro Premium Bootstrap UI Kit</td>
                                            <td>jacob.monroe@company.com</td>
                                            <td>$153.11</td>
                                            <td>Aug 28 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                          <tr>
                                            <th scope="row">17371705</th>
                                            <td>Volt Premium Bootstrap 5 Dashboard</td>
                                            <td>johndoe@gmail.com</td>
                                            <td>€61.11</td>
                                            <td>Aug 31 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                          <tr>
                                            <th scope="row">17370540</th>
                                            <td>Pixel Pro Premium Bootstrap UI Kit</td>
                                            <td>jacob.monroe@company.com</td>
                                            <td>$153.11</td>
                                            <td>Aug 28 2020</td>
                                            <td><a href="#" className="btn btn-sm btn-primary">View</a></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                </div>
                                <a href="#" className="btn btn-block btn-light">View all</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-xl-4">
                        <div className="card">
                            <h5 className="card-header">Traffic last 6 months</h5>
                            <div className="card-body">
                                <div id="traffic-chart"></div>
                            </div>
                        </div>
                    </div>
                </div>
               
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
