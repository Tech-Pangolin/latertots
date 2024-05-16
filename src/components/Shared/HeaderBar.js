import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../AuthProvider';

const HeaderBar = () => {
  const { currentUser, logout } = useAuth(); 

  return (
    <AppBar position="static">
      <Toolbar>
        <img src="./assets/img/logo.png" className="img-fluid" style={{width:'100px'}}/>
        <Button color="inherit" component={Link} to="/" className='nav-link' >Home</Button>
        <Button color="inherit" component={Link} to="/profile" className='nav-link'>Profile</Button>
        <Button color="inherit" component={Link} to="/schedule" className='nav-link'>Schedule</Button>

        {/* Add this to push the next elements to the right */}
        <Box sx={{ flexGrow: 1 }} />  
        
        {currentUser ? (
          <Button color="inherit" onClick={logout} className='nav-link'>Logout</Button>
        ) : (
          <Button color="inherit" component={Link} to="/login" className='nav-link'>Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;