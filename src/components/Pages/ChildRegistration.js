import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { fetchCurrentUser } from '../../Helpers/firebase';
import { createChildDocument } from '../../Helpers/firebase';
import { useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firestore';

const ChildRegistration = () => {
  const { register, handleSubmit, formState: {errors}, reset } = useForm();
  const { currentUser } = useAuth();

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
        await fetchCurrentUser(currentUser.email).then( async (resp) => {
          await createChildDocument(resp.id, data);
        });
      }

      // Navigate back to the profile on success
      window.location.href = '/profile';
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  return (
    <div>
      <h1>Child Registration</h1>
      <p>Add your child here!</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="Name">Name:</label>
        <input type="text" id="Name" {...register('Name', {required: true})} />
        {errors.Name && <p>Name is required</p>}

        <label htmlFor="DOB">DOB:</label>
        <input type="date" id="DOB" {...register('DOB', {required: true})} />
        {errors.DOB && <p>DOB is required</p>}

        <label htmlFor="Gender">Gender:</label>
        <select id="Gender" {...register('Gender', {required: true})}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Unspecified</option>
        </select>
        {errors.Gender && <p>Gender is required</p>}

        <label htmlFor="Allergies">Allergies:</label>
        <input type="text" id="Allergies" {...register('Allergies')} />

        <label htmlFor="Medications">Medications:</label>
        <input type="text" id="Medications" {...register('Medications')} />

        <label htmlFor="Notes">Notes:</label>
        <input type="text" id="Notes" {...register('Notes')} />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};


export default ChildRegistration;