import ContactsTable from '../Shared/ContactsTable';
import React, { useState } from 'react';
import { useAuth } from '../AuthProvider';
import ChildCard from '../Shared/ChildCard';
import UserForm from '../Shared/UserForm';
import ChildRegistration from './ChildRegistration';
import ContactRegistration from './ContactRegistration';
import { useChildrenRQ } from '../../Hooks/query-related/useChildrenRQ';
import { useContactsRQ } from '../../Hooks/query-related/useContactsRQ';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const { data: children = [] } = useChildrenRQ();
  const { data: contacts = [] } = useContactsRQ();

  const [openChildModal, setOpenChildModal] = useState(false);

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

      <div className="row">
        <div className='col-md-4'>
          <div className="row">    <div className='col-12'>
            <h1 className="text-center">{currentUser?.displayName}</h1>
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
          <ul className="nav nav-tabs mt-5" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">User Info</button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">Children</button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact-tab-pane" type="button" role="tab" aria-controls="contact-tab-pane" aria-selected="false">Contacts</button>
            </li>

          </ul>
          <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="home-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabindex="0">
              <div className='mt-5'>
                <UserForm />
              </div>
            </div>
            <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabindex="0">
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
                  tabindex="-1"
                  aria-labelledby="newChildModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        <div className="d-flex justify-content-end">
                          <button type="button" className="btn-close" onClick={() => setOpenChildModal(false)} aria-label="Close"></button>
                        </div>
                        <ChildRegistration setOpenState={setOpenChildModal}/>
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
            <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabindex="0">
              <div className='px-5 py-5'>
                <div className=" row"  >
                  <div className="col-2"><h4 className="mt-2">Contacts</h4></div>
                  <div className="col-3"><button type="button" className="btn btn-outline-primary btn-lg" data-bs-toggle="modal" data-bs-target="#contactsModal">
                    Add Contact&nbsp;<i className="bi bi-person-plus-fill"></i>
                  </button>
                  </div>
                </div>
                <ContactsTable contacts={contacts} />
              </div>
            </div>
            <div className="modal fade" id="contactsModal" tabindex="-1" aria-labelledby="contactsModalLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-body">
                    <div className="d-flex justify-content-end"> <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <ContactRegistration />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* <div className="row">
        <div className="col-md-6 border-right">
          <div className="p-3 py-5 px-4" style={{ backgroundColor: 'lavender', borderRadius: '20px' }}>

            <div className="d-flex justify-content-center align-items-start">
              <h4 className="text-center">My Profile</h4>
            </div>
            <div className="d-flex flex-column p-2 justify-content-center align-items-center">
              <img className="rounded-circle" width="200px" height="200px" src={currentUser.photoURL ? currentUser.photoURL : "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
              <span className="font-weight-bold">{currentUser?.displayName}</span><span className="text-black-50">{currentUser.email}</span><span> </span>
            </div>

          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 py-5" style={{ backgroundColor: 'lavender', borderRadius: '20px' }}>
            <div className="d-flex justify-content-between align-items-center experience">
              <h4>Children</h4>
              <a href="/addChild" className="border px-3 p-1 add-experience">Add Children&nbsp;<i className="bi bi-person-plus-fill"></i></a>
            </div>
            <br />
            {children.length > 0 && children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))}

            <div className="d-flex justify-content-between align-items-center experience mt-5">


            </div>
          </div>
        </div>
        <div className="row" style={{ backgroundColor: 'lavender', borderRadius: '20px' }}>
          <div className="col"  > <h4>Contacts</h4>
            <a href="/addContact" className="border px-3 p-1 add-experience">Add Contacts&nbsp;<i className="bi bi-person-plus-fill"></i></a>
          </div>
          <ContactsTable contacts={contacts} />
        </div>
      </div> */}

    </div>

  );
};

export default UserProfile;