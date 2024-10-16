import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../AuthProvider';
import { getAuth, signOut } from "firebase/auth";

const HeaderBar = () => {
  const { currentUser, logout } = useAuth();
    const location = useLocation();
 
  const [mobileMenu, setMobileMenu] = useState(false);
  const signOut = async () => {
    const auth = getAuth();
    try {
      await auth.signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }
  const handleMobileMenu = () => {
    setMobileMenu(!mobileMenu);
  }


  return (

    <header id="header" className="fixed-top d-flex align-items-center position-relative" style={{ background: '#E61378' }}>
      <div className="container d-flex align-items-center justify-content-between ">

        <div className="logo">
        <h1><a href="index.html">
         
          <img src="./assets/img/submark.png" alt="" className="img-fluid" /> 
          
          {/* <span className='ml-5'>LaterTots</span> */}
        </a></h1></div>

        <nav id="navbar" className={`navbar ${mobileMenu? 'navbar-mobile':''}`}>
          <ul>
            <li><a className={`nav-link scrollto ${location.pathname==='/'?'active':''}` } href="/" >Home</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/teamtots'?'active':''}` } href="/teamtots">Team Tots</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/events'?'active':''}` } href="/events">Drop-In Fun</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/activities'?'active':''}` } href="/activities">Tot-tivities</a></li>
            <li><a className={`nav-link scrollto ${location.pathname==='/deals'?'active':''}` } href="/deals">Tot Deals</a></li>
            {!currentUser ? <li><a className={`nav-link scrollto ${location.pathname==='/register'?'active':''}` } href="/register">Become a Tot</a></li>:<li><a className="nav-link scrollto" href="/profile">Profile</a></li>}
            {/* <li><a className="nav-link scrollto" href="#team">Contact Us</a></li> */}
            {!currentUser ? '': (<li><a className={`nav-link scrollto ${location.pathname==='/schedule'?'active':''}` } href="/schedule">My Schedule</a></li>)}
            {!currentUser ? (<li><a className={`nav-link scrollto ${location.pathname==='/login'?'active':''}` } href="/login">Play & Stay</a></li>) : (
              <li><a className="nav-link scrollto" onClick={signOut}>Logout</a></li>
            )}
          </ul>
          <i className="bi bi-list mobile-nav-toggle" onClick={handleMobileMenu}></i>
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