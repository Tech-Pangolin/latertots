import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import ChildCard from '../Shared/ChildCard';
import UserForm from '../Shared/UserForm';
import { logger } from '../../Helpers/logger';
import { db } from '../../config/firestore';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reloadUserDataToggle, setReloadUserDataToggle] = useState(false);
  const [dbService, setDbService] = useState(null);

  // Dialog state
  const [selectedChild, setSelectedChild] = useState(null);
  const [open, setOpen] = useState(false);
  const handleNameClick = (child) => {
    setSelectedChild(child);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  useEffect(() => {
    logger.info("currentUser: ", currentUser)

    if (dbService) {
      dbService.fetchAllCurrentUsersChildren().then((resp) => {
        setChildren(resp);
      }).catch((e) => logger.error(e));
      dbService.fetchAllCurrentUsersContacts(currentUser.email).then((resp) => {
        setContacts(resp);
      }).catch((e) => logger.error(e));
    }
  }, [currentUser.email, reloadUserDataToggle, dbService]);

  return (
    <div className="container rounded mt-5 mb-5 bg-white">

      <div className="row">
        <div className='col-md-4'>
          <div className="row">    <div className='col-12'>
            <h1 className="text-center">{currentUser?.displayName}</h1>
          </div>
            <div className="col-12 d-flex justify-content-center">
              <img className="rounded-circle" width="300px" height="300px" src={currentUser.photoURL ? currentUser.photoURL : "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
            </div>
            <div className='col-12 d-flex justify-content-center mt-5'>
              <a href="/schedule" className="border px-3 p-1 pink-text blink-text">Book Now</a>
            </div>
            <div className='col-12'>

              {/* <div className="card mt-5" >
                <ul className="list-group list-group-flush">
                  <li className="list-group-item"><strong>User Information</strong>
                  </li>
                  <li className="list-group-item"><strong>Children</strong></li>
                  <li className="list-group-item">A third item</li>
                </ul>
              </div> */}
            </div>
          

            <div className='col-12'>

            </div>
          </div>
        </div>
        <div className='col-md-8'>
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
                <UserForm reloadUserData={[reloadUserDataToggle, setReloadUserDataToggle]} /></div>
            </div>
            <div className="tab-pane fade" id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabindex="0">
              <div className='mt-5'>
                <h4>Children</h4>
                <a href="/addChild" className="border px-3 p-1 add-experience">Add Children&nbsp;<i className="bi bi-person-plus-fill"></i></a>
                <div className="mt-3 d-flex justify-content-between-start align-items-center experience">
                  {children.length > 0 && children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))}
                </div>
              </div>
            </div>
            <div className="tab-pane fade" id="contact-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabindex="0">
              <div className="mt-5"  > 
                <h4>Contacts</h4>
                <a href="/addContact" className="border px-3 p-1 add-experience">Add Contacts&nbsp;<i className="bi bi-person-plus-fill"></i></a>
              </div>
              <ContactsTable contacts={contacts} />
            </div>
          </div>
        </div>
      </div>
      {/* <h1 className="text-center">User Profile</h1> */}
      {/* <div className="d-flex justify-content-center align-items-center">
        <a href="/schedule" className="border px-3 p-1 pink-text blink-text">Book Now</a>
      </div> */}

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