import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../AuthProvider';
import { getAuth, signOut } from "firebase/auth";

const HeaderBar = () => {
  const { currentUser, logout } = useAuth();
    const location = useLocation();
 
  const [activeLink, setActiveLink] = useState(null);
  const signOut = async () => {
    const auth = getAuth();
    try {
      await auth.signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }



  return (

    <header id="header" className="fixed-top d-flex align-items-center position-relative" style={{ background: '#E61378' }}>
      <div className="container d-flex align-items-center justify-content-between">

        <div className="logo">
        <h1><a href="index.html"><span>LaterTots</span></a></h1>
          {/* <a href="index.html"><img src="./assets/img/logo.png" alt="" className="img-fluid" /></a> */}
        </div>

        <nav id="navbar" className="navbar">
          <ul>
            <li><a className={`nav-link scrollto ${location.pathname==='/'?'active':''}` } href="/" >Home</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/about'?'active':''}` } href="/about">About</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/events'?'active':''}` } href="/events">Events</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/pricing'?'active':''}` } href="pricing">Pricing</a></li>
            {!currentUser ? <li><a className={`nav-link scrollto ${location.pathname==='/register'?'active':''}` } href="/register">Registration</a></li>:<li><a className="nav-link scrollto" href="/profile">Profile</a></li>}
            {/* <li><a className="nav-link scrollto" href="#team">Contact Us</a></li> */}
            {!currentUser ? '': (<li><a className={`nav-link scrollto ${location.pathname==='/schedule'?'active':''}` } href="/schedule">My Schedule</a></li>)}
            {!currentUser ? (<li><a className={`nav-link scrollto ${location.pathname==='/login'?'active':''}` } href="/login">Login</a></li>) : (
              <li><a className="nav-link scrollto" onClick={signOut}>Logout</a></li>
            )}
          </ul>
          <i className="bi bi-list mobile-nav-toggle"></i>
        </nav>

      </div>
    </header>

  );
};

export default HeaderBar;


{/* <AppBar position="static">
      <Toolbar>
        <img src="./assets/img/logo.png" className="img-fluid" style={{width:'100px'}}/>
        <Button color="inherit" component={Link} to="/" className='nav-link' >Home</Button>
        <Button color="inherit" component={Link} to="/profile" className='nav-link'>Profile</Button>
        <Button color="inherit" component={Link} to="/schedule" className='nav-link'>Schedule</Button>

        <Box sx={{ flexGrow: 1 }} />  
        
        {currentUser ? (
          <Button color="inherit" onClick={logout} className='nav-link'>Logout</Button>
        ) : (
          <Button color="inherit" component={Link} to="/login" className='nav-link'>Login</Button>
        )}
      </Toolbar>
    </AppBar> */}