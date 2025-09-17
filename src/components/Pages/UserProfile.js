import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { useLocation } from 'react-router-dom';
import ChildCard from '../Shared/ChildCard';
import UserForm from '../Shared/UserForm';
import ChildRegistration from './ChildRegistration';
import ContactRegistration from './ContactRegistration';
import AlertContainer from '../Shared/AlertContainer';
import { useChildrenRQ } from '../../Hooks/query-related/useChildrenRQ';
import { useContactsRQ } from '../../Hooks/query-related/useContactsRQ';


const UserProfile = () => {
  const { currentUser } = useAuth();
  const { data: children = [] } = useChildrenRQ();
  const { data: contacts = [] } = useContactsRQ();
  const location = useLocation();

  const [openChildModal, setOpenChildModal] = useState(false);
  const [openContactsModal, setOpenContactsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Handle tab switching from navigation state
  useEffect(() => {
    if (location.state?.switchToTab) {
      setActiveTab(location.state.switchToTab);
    }
  }, [location.state]);

  // TODO: Open a dialog to show/edit child details when clicking on a child's name
  // Dialog state
  const [selectedChild, setSelectedChild] = useState(null);
  const [open, setOpen] = useState(false);
  const handleNameClick = (child) => {
    setSelectedChild(child);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);


  return (
    <div className="container-fluid rounded bg-blue">
      {/* Alert Container */}
      <div className="row">
        <div className="col-12 p-3">
          <AlertContainer />
        </div>
      </div>

      <div className="row">

        {/* Avatar and Book Now Button  */}
        <div className='col-md-4'>
          <div className="row">
            <div className='col-12'>
              <h1 className="text-center">{currentUser?.Name}</h1>
            </div>
            <div className="col-12 d-flex justify-content-center">
              <img className="rounded-circle" width="250px" height="250px" src={currentUser.photoURL ? currentUser.photoURL : "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
            </div>
            <div className='col-12 d-flex justify-content-center mt-5'>
              <a href="/schedule" className="border px-5 py-3 p-1 pink-text blink-text">Book Now</a>
            </div>
          </div>
        </div>


        <div className='col-md-7 profile'>

          {/* Tab Navigation Header */}
          <ul className="nav nav-tabs mt-5" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} 
                id="home-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#home-tab-pane" 
                type="button" 
                role="tab" 
                aria-controls="home-tab-pane" 
                aria-selected={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
              >
                User Info
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'children' ? 'active' : ''}`} 
                id="profile-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#profile-tab-pane" 
                type="button" 
                role="tab" 
                aria-controls="profile-tab-pane" 
                aria-selected={activeTab === 'children'}
                onClick={() => setActiveTab('children')}
              >
                Children
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'contacts' ? 'active' : ''}`} 
                id="contact-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#contact-tab-pane" 
                type="button" 
                role="tab" 
                aria-controls="contact-tab-pane" 
                aria-selected={activeTab === 'contacts'}
                onClick={() => setActiveTab('contacts')}
              >
                Contacts
              </button>
            </li>
          </ul>


          <div className="tab-content" id="myTabContent">

            {/* currentUser's Profile Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'home' ? 'show active' : ''}`} id="home-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabIndex="0">
              <div className='mt-5'>
                <UserForm />
              </div>
            </div>

            {/* currentUser's Children Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'children' ? 'show active' : ''}`} id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">
              <div className='px-5 py-5'>
                <div className='row'>
                  <div className="col-2"> <h3 className="mt-2">Children</h3></div>
                  <div className="col-9">
                    <button type="button" className="btn btn-outline-primary btn-lg" onClick={() => setOpenChildModal(true)}>
                      Add Children&nbsp;<i className="bi bi-person-plus-fill"></i>
                    </button>
                  </div>
                </div>

                <div
                  className={`modal fade ${openChildModal ? 'show' : ''}`}
                  style={{ display: openChildModal ? 'block' : 'none' }}
                  tabIndex="-1"
                  aria-labelledby="newChildModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        <div className="d-flex justify-content-end">
                          <button type="button" className="btn-close" onClick={() => setOpenChildModal(false)} aria-label="Close"></button>
                        </div>
                        <ChildRegistration setOpenState={setOpenChildModal} />
                      </div>
                    </div>
                  </div>
                </div>
                {openChildModal && <div className="modal-backdrop fade show"></div>}

                <div className="mt-3 d-flex justify-content-between-start align-items-center experience">
                  {children.length > 0 &&
                    children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))
                  }
                </div>
              </div>
            </div>

            {/* currentUser's Contacts Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'contacts' ? 'show active' : ''}`} id="contact-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabIndex="0">
              <div className='px-5 py-5'>
                <div className=" row"  >
                  <div className="col-2"><h4 className="mt-2">Contacts</h4></div>
                  <div className="col-3">
                    <button type="button" className="btn btn-outline-primary btn-lg" onClick={() => setOpenContactsModal(true)}>
                      Add Contact&nbsp;<i className="bi bi-person-plus-fill"></i>
                    </button>
                  </div>
                </div>
                <ContactsTable contacts={contacts} />
              </div>
            </div>

            <div
              className={`modal fade ${openContactsModal ? 'show' : ''}`}
              style={{ display: openContactsModal ? 'block' : 'none' }}
              tabIndex="-1"
              aria-labelledby="newContactModalLabel"
              aria-hidden="true"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn-close" onClick={() => setOpenContactsModal(false)} aria-label="Close"></button>
                    </div>
                    <ContactRegistration setOpenState={setOpenContactsModal} />
                  </div>
                </div>
              </div>
            </div>
            {openContactsModal && <div className="modal-backdrop fade show"></div>}

          </div>
        </div>
      </div>

    </div>

  );
};

export default UserProfile;