import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '../../Helpers/logger';
import { db } from '../../config/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { joiResolver } from '@hookform/resolvers/joi';
import { generateContactSchema } from '../../schemas/ContactSchema';
import { CONTACT_RELATIONS } from '../../Helpers/constants';


function ContactRegistration({ setOpenState }) {
  const { register, handleSubmit, formState: {errors}, reset } = useForm({
    resolver: joiResolver(generateContactSchema(true))
  });
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
    const payload = {
      ...data,
      archived: false,
    }

    try {
      const validatedPayload = await generateContactSchema().validateAsync(payload);

      if (contact) {
        updateContactMutation.mutate(validatedPayload);
      } else {
        createContactMutation.mutate(validatedPayload);
      }
    } catch (error) {
      if (error.isJoi) {
        logger.error('Contact validation error:', error.details);
        return;
      }
      logger.error('Error creating new contact:', error);
    }
  };

  const schemaErrors = errors[""];

  return (
    <div className="container">
      <h1>Contact Registration</h1>
      <div className="row">
        <form onSubmit={handleSubmit(onSubmit)} className='col-12'>
          <label htmlFor="Name" className="form-label">Name:</label>
          <input type="text" id="NameContact" {...register('Name')} className="form-control mb-4" />
          {errors.Name?.message && <p className='text-danger'>{errors.Name.message}</p>}

          <label htmlFor="Phone" className="form-label">Phone:</label>
          <input type="tel" id="Phone" {...register('Phone')} className="form-control mb-4" />
          {errors.Phone?.message && <p className='text-danger'>{errors.Phone.message}</p>}

          <label htmlFor="Email" className="form-label">Email:</label>
          <input type="email" id="Email" {...register('Email')} className="form-control mb-4" />
          {errors.Email?.message && <p className='text-danger'>{errors.Email.message}</p>}

          <label htmlFor="Relation" className="form-label">Relation:</label>
          <select id="Relation" {...register('Relation')} className="form-control">
            <option value={CONTACT_RELATIONS.PARENT}>                   Parent</option>
            <option value={CONTACT_RELATIONS.FAMILY}>                   Family</option>
            <option value={CONTACT_RELATIONS.LEGAL_GUARDIAN}>           Legal Guardian</option>
            <option value={CONTACT_RELATIONS.FAMILY_FRIEND}>            Family Friend</option>
            <option value={CONTACT_RELATIONS.DOCTOR}>                   Doctor</option>
            <option value={CONTACT_RELATIONS.PROFESSIONAL_CAREGIVER}>   Professional Caregiver</option>
            <option value={CONTACT_RELATIONS.O}>                        Other</option>
          </select>
          {errors.Relation?.message && <p className='text-danger'>{errors.Relation.message}</p>}
          <br/>
          {schemaErrors?.message && <p className="text-danger">{schemaErrors.message}</p>}

          <button type="submit" className="btn btn-primary mt-5">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default ContactRegistration;