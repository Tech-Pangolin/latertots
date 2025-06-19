import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '../../Helpers/logger';
import { db } from '../../config/firestore';
import { doc, updateDoc } from 'firebase/firestore';

function ContactRegistration({ setOpenState }) {
  const { register, handleSubmit, reset } = useForm();
  const { currentUser, dbService } = useAuth();
  const queryClient = useQueryClient();
  const [contact, setContact] = useState(null); // State to hold the contact when editing an existing one


  const createContactMutation = useMutation({
    mutationKey: ['createContact'],
    mutationFn: async (data) => await dbService.createContactDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fetchChildren', currentUser.Email]);
      reset(); // Reset the form after successful submission
      setOpenState(false); 
    },
    onError: (error) => {
      logger.error('Error creating Contact document:', error);
    }
  })

  const updateContactMutation = useMutation({
    mutationKey: ['updateContact'],
    mutationFn: async (data) => {
      const contactRef = doc(db, 'Contacts', contact.id);
      return await updateDoc(contactRef, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fetchContacts', currentUser.Email]);
      reset(); // Reset the form after successful submission
      setOpenState(false); 
    },
    onError: (error) => {
      logger.error('Error updating Contact document:', error);
    }
  })

  const onSubmit = async (data) => {
    if (contact) {
      updateContactMutation.mutate(data);
    } else {
      createContactMutation.mutate(data);
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