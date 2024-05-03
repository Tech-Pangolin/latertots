import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../AuthProvider';

const HeaderBar = () => {
  const { currentUser, logout } = useAuth(); 

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ marginRight: '15px'}}>
          LaterTots
        </Typography>

        <Button color="inherit" component={Link} to="/" >Home</Button>
        <Button color="inherit" component={Link} to="/profile">Profile</Button>
        <Button color="inherit" component={Link} to="/schedule">Schedule</Button>

        {/* Add this to push the next elements to the right */}
        <Box sx={{ flexGrow: 1 }} />  
        
        {currentUser ? (
          <Button color="inherit" onClick={logout}>Logout</Button>
        ) : (
          <Button color="inherit" component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;