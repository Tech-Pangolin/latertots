import React from 'react';

const DashNav = ({ setCurrentView }) => {

  return (
    <>
      <nav id="sidebar" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
        <div className="position-sticky">
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#" onClick={() => setCurrentView('dashboard')} >
                <span className="ml-2">Admin Home</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#" onClick={() => setCurrentView('users')} >
                <span className="ml-2">View Users</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={() => setCurrentView('children')} >
                <span className="ml-2">View Children</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={() => setCurrentView('contacts')} >
                <span className="ml-2">View Contacts</span>
              </a>
            </li>

          </ul>
        </div>
      </nav>
    </>
  );
};

export default DashNav;