import React from 'react';
import HeaderBar from './Shared/HeaderBar';
import FooterBar from './Shared/FooterBar';


const Layout = ({ children }) => {
  return (
    <>
      <HeaderBar />
      <main>
        {children}
      </main>
      <FooterBar />
    </>
  );
};

export default Layout;
