import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import MuiGrid from '@mui/material/Grid';
import MuiButton from '@mui/material/Button';
import { fetchAllCurrentUsersChildren, fetchAllCurrentUsersContacts, fetchCurrentUser } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import ChildCard from '../Shared/ChildCard';
import { Avatar, Typography } from '@mui/material';
import ChildInfoDialog from '../Shared/ChildInfoDialog';

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
    fetchCurrentUser(currentUser.email).then((resp) => {
      setUser(resp);
    });
    fetchAllCurrentUsersChildren(currentUser.email).then((resp) => {
      setChildren(resp);
    });
    fetchAllCurrentUsersContacts(currentUser.email).then((resp) => {
      setContacts(resp);
    });
  }, [currentUser.email]);

  return (
      <div>
        <h1>User Profile</h1>
        <MuiGrid container spacing={2}>

          {/* User Section */}
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


          {/* Children Section */}
          <MuiGrid item xs={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Children</h2>
              <MuiButton variant="contained" onClick={() => window.location.href = '/addChild'}>
                Add Child
              </MuiButton>
            </div>
            <div style={{ display: 'flex' }}>
              {children.map((child) => (<ChildCard child={child} onNameClick={handleNameClick} />))}
            </div>
            <ChildInfoDialog selectedChild={selectedChild} open={open} handleClose={handleClose} />
          </MuiGrid>


          {/* Contacts Section */}
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
        
      </div>
  );
};

export default UserProfile;