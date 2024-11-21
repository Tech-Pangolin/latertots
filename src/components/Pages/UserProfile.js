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
  const [user, setUser] = useState(null);
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
    logger.info("currentUser: ",currentUser)

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
    <div className="container rounded bg-white mt-5 mb-5">
      <h1 className="text-center">User Profile</h1>
      <div className="d-flex justify-content-center align-items-center">
        <a href="/schedule" className="border px-3 p-1 pink-text blink-text">Book Now</a>
      </div>
      
      <div className="row">
        {/* <div className="col-md-3 border-right">
         
        </div> */}
        <div className="col-md-6 border-right">
          <div className="p-3 py-5">

            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-right">Profile Settings</h4>
            </div>
            <div className="d-flex flex-column p-2">
              <img className="rounded-circle" width="200px" height="200px" src={currentUser.PhotoURL ? currentUser.PhotoURL : "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
              <span className="font-weight-bold">{currentUser?.displayName}</span><span className="text-black-50">{currentUser.email}</span><span> </span>
            </div>
            <UserForm reloadUserData={[reloadUserDataToggle, setReloadUserDataToggle]} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 py-5">
            <div className="d-flex justify-content-between align-items-center experience">
              <h4>Children</h4>
              <a href="/addChild" className="border px-3 p-1 add-experience">Add Children&nbsp;<i className="bi bi-person-plus-fill"></i></a>
            </div>
            <br />
            {children.length > 0 && children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))}
            
            <div className="d-flex justify-content-between align-items-center experience mt-5">
              <h4>Contacts</h4>
              <a href="/addContact" className="border px-3 p-1 add-experience">Add Contacts&nbsp;<i className="bi bi-person-plus-fill"></i></a>
            </div>
            <ContactsTable contacts={contacts} />
          </div>
        </div>
      </div>

    </div>

  );
};

export default UserProfile;