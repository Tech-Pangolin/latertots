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
    <div className="container">
      <h1>Contact Registration</h1>
      <div className="row">
      <form onSubmit={handleSubmit(onSubmit)} className='col-6'>
        <label htmlFor="Name" class="form-label">Name:</label>
        <input type="text" id="Name" {...register('Name', { required: true })} class="form-control" />

        <label htmlFor="Phone" class="form-label">Phone:</label>
        <input type="tel" id="Phone" {...register('Phone')} class="form-control" />

        <label htmlFor="Email" class="form-label">Email:</label>
        <input type="Email" id="Email" {...register('Email')} class="form-control" />

        <label htmlFor="Relation" class="form-label">Relation:</label>
        <select id="Relation" {...register('Relation', { required: true })} class="form-control">
          <option value="Parent">Parent</option>
          <option value="Family">Family</option>
          <option value="Guardian">Legal Guardian</option>
          <option value="Friend">Family Friend</option>
          <option value="Doctor">Doctor</option>
          <option value="Professional Caregiver">Professional Caregiver</option>
          <option value="Other">Other</option>
        </select>

        <button type="submit" className="btn btn-primary mt-5">Submit</button>
      </form>
      </div>
    </div>
  );
}

export default ContactRegistration;