import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '../../Helpers/logger';
import { joiResolver } from '@hookform/resolvers/joi';
import { generateChildSchema } from '../../schemas/ChildSchema';
import { GENDERS } from '../../Helpers/constants';

const ChildRegistration = ({ setOpenState }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(generateChildSchema(true))
  });
  const { currentUser, dbService } = useAuth();
  const queryClient = useQueryClient();

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

  const createChildMutation = useMutation({
    mutationKey: ['createChild'],
    mutationFn: async (data) => await dbService.createChildDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fetchChildren', currentUser.Email]);
      reset(); // Reset the form after successful submission
      setOpenState(false); // Close the modal after submission
    },
    onError: (error) => {
      logger.error('Error creating child document:', error);
    }
  })

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      archived: false,
    }

    try {
      const validatedPayload = await generateChildSchema().validateAsync(payload);

      if (child) {
        // Update the existing child document
        const childRef = doc(db, 'Children', child.id);
        await updateDoc(childRef, validatedPayload);
      } else {
        // Create a new child document
        createChildMutation.mutate(validatedPayload);
      }
    } catch (error) {
      if (error.isJoi) {
        logger.error('Child registration failed validation:', error.details);
        logger.error('Child registration error details:', error.details);
      }
      logger.error('Error adding document: ', error);
    }
  };

  return (
    <div className='container bg-white'>
      <h1 className="text-center pt-5">Child Registration</h1>
      <p className="text-center">Add your child here!</p>
      <div className="row d-flex justify-content-center">
        <form onSubmit={handleSubmit(onSubmit)} className='col-md-12'>
          <label htmlFor="Name" className="form-label">Name:</label>
          <input type="text" disabled={child?.Name} id="Name" {...register('Name')} className="form-control" />
          {errors.Name?.message && <p>{errors.Name.message}</p>}

          <label htmlFor="DOB" className="form-label">DOB:</label>
          <input type="date" id="DOB" {...register('DOB')} className="form-control" />
          {errors.DOB?.message && <p>{errors.DOB.message}</p>}

          <label htmlFor="Gender" className="form-label">Gender:</label>
          <select id="Gender" {...register('Gender')} className="form-control">
            {Object.values(GENDERS).map(option => {
              return <option key={option} value={option}>{option}</option>;
            })}
          </select>
          {errors.Gender?.message && <p>{errors.Gender.message}</p>}

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