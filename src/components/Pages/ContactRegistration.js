import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { FirebaseDbService } from '../../Helpers/firebase';

function ContactRegistration() {
  const { register, handleSubmit } = useForm();
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);


  const onSubmit = async (data) => {
    try {
      await dbService.createContactDocument(data);

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
      <form onSubmit={handleSubmit(onSubmit)} className='col-12'>
        <label htmlFor="Name" className="form-label">Name:</label>
        <input type="text" id="Name" {...register('Name', { required: true })} className="form-control" />

        <label htmlFor="Phone" className="form-label">Phone:</label>
        <input type="tel" id="Phone" {...register('Phone')} className="form-control" />

        <label htmlFor="Email" className="form-label">Email:</label>
        <input type="Email" id="Email" {...register('Email')} className="form-control" />

        <label htmlFor="Relation" className="form-label">Relation:</label>
        <select id="Relation" {...register('Relation', { required: true })} className="form-control">
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