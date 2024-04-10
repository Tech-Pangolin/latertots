import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { createContactDocument, fetchCurrentUser } from '../../Helpers/firebase';

function ContactRegistration() {
  const { register, handleSubmit } = useForm();
  const { currentUser: { email } } = useAuth();
  const [authUserId, setAuthUserId] = React.useState(null);

  useEffect(() => { 
    fetchCurrentUser(email).then((resp) => setAuthUserId(resp.id));
  }, [email]);

  const onSubmit = async (data) => {
    try {
      await createContactDocument(authUserId, data);

      // Redirect to the user profile page
      window.location.href = '/profile';
    } catch (error) {
      console.error("Error creating contact document:", error);
    }
  };

  return (
    <>
    <h1>Contact Registration</h1>

    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="Name">Name:</label>
      <input type="text" id="Name" {...register('Name', {required: true}) } />

      <label htmlFor="Phone">Phone:</label>
      <input type="tel" id="Phone" {...register('Phone')} />

      <label htmlFor="Email">Email:</label>
      <input type="Email" id="Email" {...register('Email')} />

      <label htmlFor="Relation">Relation:</label>
      <select id="Relation" {...register('Relation', {required: true})}>
        <option value="Parent">Parent</option>
        <option value="Family">Family</option>
        <option value="Guardian">Legal Guardian</option>
        <option value="Friend">Family Friend</option>
        <option value="Doctor">Doctor</option>
        <option value="Professional Caregiver">Professional Caregiver</option>
        <option value="Other">Other</option>
      </select>

      <button type="submit">Submit</button>
    </form>
    </>
  );
}

export default ContactRegistration;