import React, { useEffect } from 'react';
import { fetchAllUsers } from '../../Helpers/firebase';
import UsersTable from '../Shared/UserTable';

function HomePage() {
  const [users, setUsers] = React.useState([]);
  useEffect(() => {
    fetchAllUsers().then((resp) => {
      setUsers(resp);
    });
  }, []);
  
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <UsersTable users={users} />
    </div>
  );
}

export default HomePage;