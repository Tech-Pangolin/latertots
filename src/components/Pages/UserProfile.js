import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import MuiGrid from '@mui/material/Grid';
import MuiButton from '@mui/material/Button';
import { fetchAllCurrentUsersChildren, fetchAllCurrentUsersContacts, fetchCurrentUser } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import ChildCard from '../Shared/ChildCard';
import { Avatar, Typography } from '@mui/material';
import ChildInfoDialog from '../Shared/ChildInfoDialog';
import UserForm from '../Shared/UserForm';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Dialog state
  const [selectedChild, setSelectedChild] = useState(null);
  const [open, setOpen] = useState(false);
  const handleNameClick = (child) => {
    setSelectedChild(child);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  useEffect(() => {
    console.log(currentUser)
    fetchCurrentUser(currentUser.email).then((resp) => {
      setUser(resp)
      console.log("user",resp)
    }).catch((e) => console.error(e));
    fetchAllCurrentUsersChildren(currentUser.email).then((resp) => {
      setChildren(resp);
    }).catch((e) => console.error(e));
    fetchAllCurrentUsersContacts(currentUser.email).then((resp) => {
      setContacts(resp);
    }).catch((e) => console.error(e));
  }, [currentUser.email]);

  return (
    <div className="container rounded bg-white mt-5 mb-5">
      <div className="row">
        <div className="col-md-3 border-right">
          <div className="d-flex flex-column align-items-center text-center p-3 py-5">
            <img className="rounded-circle mt-5" width="150px" src={(user && user.PhotoURL) ? user.PhotoURL :"https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
            <span className="font-weight-bold">{currentUser?.displayName}</span><span className="text-black-50">{currentUser.email}</span><span> </span>
            </div>
        </div>
        <div className="col-md-5 border-right">
          <div className="p-3 py-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="text-right">Profile Settings</h4>
            </div>
            <UserForm />
            {/* <div className="row mt-2">
              <div className="col-md-6"><label className="labels">Name</label><input type="text" className="form-control" placeholder="first name" value="" /></div>
              <div className="col-md-6"><label className="labels">Surname</label><input type="text" className="form-control" value="" placeholder="surname" /></div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12"><label className="labels">Mobile Number</label><input type="text" className="form-control" placeholder="enter phone number" value="" /></div>
              <div className="col-md-12"><label className="labels">Address Line 1</label><input type="text" className="form-control" placeholder="enter address line 1" value="" /></div>
              <div className="col-md-12"><label className="labels">Address Line 2</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
              <div className="col-md-12"><label className="labels">Postcode</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
              <div className="col-md-12"><label className="labels">State</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
              <div className="col-md-12"><label className="labels">Area</label><input type="text" className="form-control" placeholder="enter address line 2" value="" /></div>
              <div className="col-md-12"><label className="labels">Email ID</label><input type="text" className="form-control" placeholder="enter email id" value="" /></div>
              <div className="col-md-12"><label className="labels">Education</label><input type="text" className="form-control" placeholder="education" value="" /></div>
            </div>
            <div className="row mt-3">
              <div className="col-md-6"><label className="labels">Country</label><input type="text" className="form-control" placeholder="country" value="" /></div>
              <div className="col-md-6"><label className="labels">State/Region</label><input type="text" className="form-control" value="" placeholder="state" /></div>
            </div>
            <div className="mt-5 text-center"><button className="btn btn-primary profile-button" type="button">Save Profile</button></div> */}
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 py-5">
            <div className="d-flex justify-content-between align-items-center experience"><h4>Children</h4><a href="/addChild" className="border px-3 p-1 add-experience">Add Children&nbsp;<i className="bi bi-person-plus-fill"></i></a></div><br />
            {children.length>0 && children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))}
            <div className="d-flex justify-content-between align-items-center experience mt-5"><h4>Contacts</h4><a href="/addContact" className="border px-3 p-1 add-experience">Add Contacts&nbsp;<i className="bi bi-person-plus-fill"></i></a></div>
            <ContactsTable contacts={contacts} />
          </div>
        </div>
      </div>
      {/* <div>
        <h1>User Profile</h1>
        <MuiGrid container spacing={2}>

          <MuiGrid container spacing={2} alignItems="center">
            <MuiGrid item>
              <Avatar src={user?.Photo} sx={{ marginLeft: '75px', marginRight: '75px', width: 300, height: 300 }} />
            </MuiGrid>
            <MuiGrid item xs>
              <Typography variant="h2">{user?.Name}</Typography>
              <Typography variant="h4">{user?.Email}</Typography>
              <Typography variant="h4">{user?.Cell}</Typography>
              <Typography variant="h4">{user?.StreetAddress}</Typography>
              <Typography variant="h4">{user?.City}, {user?.State} {user?.Zip}</Typography>
            </MuiGrid>
          </MuiGrid>


          <MuiGrid item xs={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Children</h2>
              <MuiButton variant="contained" onClick={() => window.location.href = '/addChild'}>
                Add Child
              </MuiButton>
            </div>
            <div style={{ display: 'flex' }}>
              {children.length} 
               {children.length>0 && children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} />))}
            </div>
            { <ChildInfoDialog selectedChild={selectedChild} open={open} handleClose={handleClose} /> }
          </MuiGrid>


          Contacts Section
          <MuiGrid item xs={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Contacts</h2>
              <MuiButton variant="contained" onClick={() => window.location.href = '/addContact'}>
                Add Contact
              </MuiButton>
            </div>
            <ContactsTable contacts={contacts} />
          </MuiGrid>
        </MuiGrid>
        
      </div> */}
    </div>

  );
};

export default UserProfile;