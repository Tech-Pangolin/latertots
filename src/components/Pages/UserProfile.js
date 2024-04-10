import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import MuiGrid from '@mui/material/Grid';
import MuiButton from '@mui/material/Button';
import { fetchAllCurrentUsersChildren, fetchAllCurrentUsersContacts, fetchCurrentUser } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import HeaderBar from '../Shared/HeaderBar';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [contacts, setContacts] = useState([]);

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
    <>
      <HeaderBar />
      <div>
        <h1>User Profile</h1>
        <MuiGrid container spacing={2}>
          {/* User Section */}
          <MuiGrid item xs={12}>
            {user && (
              <div>
                <p>Name: {user.Name}</p>
                <p>Email: {user.Email}</p>
                <p>Cell: {user.Cell}</p>
                <p>Street Address: {user.StreetAddress}</p>
                <p>City: {user.City}</p>
                <p>State: {user.State}</p>
                <p>Zip: {user.Zip}</p>
                <img src={user.Photo} alt="User Avatar" />
              </div>
            )}
          </MuiGrid>

          {/* Children Section */}
          <MuiGrid item xs={12}>
            <h2>Children</h2>
            <MuiButton variant="contained" onClick={() => window.location.href = '/addChild'}>
              Add Child
            </MuiButton>
            <div style={{ display: 'flex' }}>
              {children.map((child) => (
                <div key={child.id} style={{ marginRight: '10px' }}>
                  <p>Name: {child.Name}</p>
                  <p>DOB: {child.DOB}</p>
                  <p>Gender: {child.Gender}</p>
                  <p>Allergies: {child.Allergies}</p>
                  <p>Medications: {child.Medications}</p>
                  <p>Notes: {child.Notes}</p>
                </div>
              ))}
            </div>
          </MuiGrid>

          {/* Contacts Section */}
          <MuiGrid item xs={12}>
            <h2>Contacts</h2>
            <MuiButton variant="contained" onClick={() => window.location.href = '/addContact'}>
              Add Contact
            </MuiButton>
            <ContactsTable contacts={contacts} />
          </MuiGrid>
        </MuiGrid>
      </div>
    </>
  );
};

export default UserProfile;