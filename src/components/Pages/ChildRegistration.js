import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firestore';

const ChildRegistration = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  // Get the child from the location state
  // This is passed from the ChildCard component when editing
  const location = useLocation();
  const child = location.state?.child || null;

  // Pre-populate the form with the child data if editing
  useEffect(() => {
    if (child) {
      reset(child);
    }
  }, [child, reset]);

  const onSubmit = async (data) => {
    try {
      if (child) {
        // Update the existing child document
        const childRef = doc(db, 'Children', child.id);
        await updateDoc(childRef, data);
      } else {
        // Create a new child document
        await dbService.createChildDocument(data);
      }

      // Navigate back to the profile on success
      window.location.href = '/profile';
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  return (
    <div className='container bg-white'>
      <h1 className="text-center pt-5">Child Registration</h1>
      <p className="text-center">Add your child here!</p>
      <div className="row d-flex justify-content-center">
        <form onSubmit={handleSubmit(onSubmit)} className='col-md-12'>
          <label htmlFor="Name" className="form-label">Name:</label>
          <input type="text" disabled={child?.Name} id="Name" {...register('Name', { required: true })} className="form-control" />
          {errors.Name && <p>Name is required</p>}

          <label htmlFor="DOB" className="form-label">DOB:</label>
          <input type="date" id="DOB" {...register('DOB', { required: true })} className="form-control" />
          {errors.DOB && <p>DOB is required</p>}

          <label htmlFor="Gender" className="form-label">Gender:</label>
          <select id="Gender" {...register('Gender', { required: true })} className="form-control">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Unspecified</option>
          </select>
          {errors.Gender && <p>Gender is required</p>}

          <label htmlFor="Allergies" className="form-label">Allergies:</label>
          <input type="text" id="Allergies" {...register('Allergies')} className="form-control" />

          <label htmlFor="Medications" className="form-label">Medications:</label>
          <input type="text" id="Medications" {...register('Medications')} className="form-control" />

          <label htmlFor="Notes" className="form-label">Notes:</label>
          <input type="text" id="Notes" {...register('Notes')} className="form-control" />

          <button type="submit" className="my-5 btn btn-primary login-btn w-100">Submit</button>
        </form>
      </div>
    </div>
  );
};


export default ChildRegistration;