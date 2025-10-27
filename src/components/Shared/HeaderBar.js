import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import Avatar from '@mui/material/Avatar';
import { logger } from '../../Helpers/logger';

const HeaderBar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();


  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTeamTots, setShowTeamTots] = useState(false);
  const [showBigTots, setShowBigTots] = useState(false);
  const [showDropIn, setShowDropIn] = useState(false);

  const handleMobileMenu = () => {
    setMobileMenu(!mobileMenu);
  }
  const expandChildren = (link) => {
    setShowTeamTots(false);
    setShowBigTots(false);
    setShowDropIn(false);
    switch (link) {
      case 'teamtots':
        setShowTeamTots(!showTeamTots);
        break;
      case 'dropin':
        setShowDropIn(!showDropIn);
        break;
      case 'bigtots':
        setShowBigTots(!showBigTots);
        break;
      default:
        break;
    }


  }

  const dropdownActiveTeam = () => {
    const path = location.pathname;
    switch (path) {
      case '/teamtots':
        return 'active'
      case '/testimonials':
        return 'active'
      case '/careers':
        return 'active'

      default:
        return ''
    }

  }
  const dropdownActiveTots = () => {
    const path = location.pathname;
    switch (path) {
      case '/totstidbits':
        return 'active'

      default:
        return ''
    }

  }


  return (

    <header id="header" className="fixed-top d-flex align-items-center position-relative">
      <div className="container d-flex align-items-center justify-content-between ">

        <div className="logo">
          <h1><a href="index.html">

            <img src="/assets/img/submark.png" alt="" className="img-fluid" />

          </a></h1></div>

        <nav id="navbar" className={`navbar ${mobileMenu ? 'navbar-mobile' : ''}`}>
          <ul>
            <li><a id="home-link" className={` nav-link scrollto ${location.pathname === '/' ? 'active' : ''}`} href={currentUser ? "/profile" : "/"}>Home</a></li>

            {/* Show the marketing pages if the current user is not an admin */}
            {(!currentUser || currentUser.Role !== 'admin') && <>
              <li className="nav-item dropdown">
                <a id="team-link" className={`nav-link team-link dropdown-toggle scrollto ${dropdownActiveTeam()}`} onClick={() => expandChildren('teamtots')} href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Team Tots
                </a>
                <ul className={`dropdown-menu ${showTeamTots ? 'd-block' : ''}`}>
                  <li><a className={`nav-link scrollto ${location.pathname === '/teamtots' ? 'active' : ''}`} href="/teamtots">Meet</a></li>
                  <li><a className="dropdown-item" href="/testimonials">Share</a></li>
                  <li><a className="dropdown-item" href="/careers">Grow</a></li>
                </ul>
              </li>
              <li className="nav-item dropdown">
                <a id="big-tots-link" className={`nav-link big-tots-link dropdown-toggle scrollto ${dropdownActiveTots()}`} onClick={() => expandChildren('bigtots')} href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Big Tots
                </a>
                <ul className={`dropdown-menu ${showBigTots ? 'd-block' : ''}`}>
                  <li><a className={`nav-link scrollto ${location.pathname === '/totstidbits' ? 'active' : ''}`} href="/totstidbits">Tots & Tidbits</a></li>
                  {!currentUser ? <li><a id="" className={`nav-link become-link scrollto ${location.pathname === '/register' ? 'active' : ''}`} href="/register">Become a Tot</a></li> : <li><a className="nav-link scrollto" href="/profile">Profile</a></li>}
                  {<li><a className={`nav-link login-link scrollto ${location.pathname === '/login' ? 'active' : ''}`} href="/login">Play & Stay</a></li>}
                </ul>
              </li>

              {/* <li><a className={`nav-link scrollto ${location.pathname === '/teamtots' ? 'active' : ''}`} href="/teamtots">Team Tots</a></li> */}
              <li className='nav-item dropdown'>
                <a id="dropin-link" className={`nav-link dropdown-toggle dropin-link scrollto ${location.pathname === '/events' ? 'active' : ''}`} onClick={() => expandChildren('dropin')} href="/events">Drop-In Fun</a>
                <ul className={`dropdown-menu ${showDropIn ? 'd-block' : ''}`}>
                  <li><a id="" className={`nav-link dropdown-item scrollto ${location.pathname === '/events' ? 'active' : ''}`} href="/events">Play</a></li>
                  <li><a id="" className={`nav-link dropdown-item scrollto ${location.pathname === '/totivities' ? 'active' : ''}`} href="/totivities">Tot-tivities</a></li>
                  <li><a id="" className={`nav-link dropdown-item scrollto ${location.pathname === '/deals' ? 'active' : ''}`} href="/party">Party</a></li>
                </ul>
              </li>
              <li><a id="deals-link" className={`nav-link deals-link scrollto ${location.pathname === '/deals' ? 'active' : ''}`} href="/deals">Tot Deals</a></li>
            </>}

            {/* Hide the marketing pages if the current user is an admin */}
            {(currentUser && currentUser.Role === 'admin') && <>
              <li><a id="team-link" className={`nav-link dropin-link scrollto ${location.pathname === '/admin' ? 'active' : ''}`} href="/admin">Admin Dashboard</a></li>
            </>}


            {!currentUser ? '' : (<li><a id="schedule-link" className={`nav-link login-link scrollto ${location.pathname === '/schedule' ? 'active' : ''}`} href="/schedule">My Schedule</a></li>)}

            {/* {!currentUser ? (<li><a className={`nav-link login-link scrollto ${location.pathname === '/login' ? 'active' : ''}`} href="/login">Login</a></li>) : (
              <li><a id="logout-link" className="nav-link scrollto logout-link" onClick={signOut}>Logout</a></li>
            )} */}
            {currentUser && (
              <li><a id="logout-link" className="nav-link scrollto logout-link" style={{ cursor: 'pointer' }} onClick={logout}>Logout</a></li>
            )}
            {currentUser && <a href="/profile"><Avatar sx={{ margin:"10px"}} alt="Remy Sharp" src={currentUser.PhotoURL} /></a>}
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
        <img src="/assets/img/logo.png" className="img-fluid" style={{width:'100px'}}/>
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