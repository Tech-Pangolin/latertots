import React from 'react';
import { Box } from '@mui/material';
import HeaderBar from './Shared/HeaderBar';
import FooterBar from './Shared/FooterBar';


const Layout = ({ children }) => {
  return (
    <>
    <HeaderBar />
    {/* <Box sx={{ mx: '200px', mt: '20px', mb:'50px' }}> */}
      <main>
        {children}  {/* This is where the routed components will be rendered */}
      </main>
    <FooterBar />
    {/* </Box> */}
    </>
    
  );
};

export default Layout;
