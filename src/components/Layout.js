import React from 'react';
import { Box } from '@mui/material';
import HeaderBar from './Shared/HeaderBar';


const Layout = ({ children }) => {
  return (
    <>
    <HeaderBar />
    <Box sx={{ mx: '200px', mt: '20px', mb:'50px' }}>
      <main>
        {children}  {/* This is where the routed components will be rendered */}
      </main>
      {/* Add a footer here if needed */}
    </Box>
    </>
    
  );
};

export default Layout;
