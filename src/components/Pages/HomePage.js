import React from 'react';
import { db } from '../../config/firestore';
import { collection, addDoc } from 'firebase/firestore';
import UserForm from '../Shared/UserForm';

function HomePage() {
  // const addData = async () => {
  //   try {
  //     const docRef = await addDoc(collection(db, 'users'), {
  //       name: 'Ada Lovelace',
  //       email: 'nobody@nowhere.no',
  //     });
  //     console.log('Document written with ID: ', docRef.id);
  //   }
  //   catch (e) {
  //     console.error('Error adding document: ', e);
  //   }
  // }

  // addData();
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <UserForm />
    </div>
  );
}

export default HomePage;