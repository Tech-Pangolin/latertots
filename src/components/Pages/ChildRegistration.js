import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../AuthProvider';
import { useLocation } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '../../Helpers/logger';
import { joiResolver } from '@hookform/resolvers/joi';
import { generateChildSchema } from '../../schemas/ChildSchema';
import { GENDERS } from '../../Helpers/constants';

const ChildRegistration = ({ setOpenState, addAlert }) => {
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

  const updateChildMutation = useMutation({
    mutationKey: ['updateChild'],
    mutationFn: async ({ validatedFormData, childImage }) => {
      if (!dbService) throw new Error("Database service is not initialized");
      
      // Handle photo upload if present
      if (childImage) {
        try {
          let PhotoURL = await dbService.uploadChildPhoto(child.id, childImage);
          validatedFormData.PhotoURL = PhotoURL;
        } catch (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
      }
      
      const childRef = doc(db, 'Children', child.id);
      return await updateDoc(childRef, validatedFormData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fetchChildren', currentUser.Email]);
      reset();
      setOpenState(false);
      addAlert('success', 'Child updated successfully!');
    },
    onError: (error) => {
      logger.error('Error updating child document:', error);
      addAlert('error', `Update failed: ${error.message}`);
    }
  });

  const onSubmit = async (data) => {
    // STAGE 1: Extract image before processing (following UserForm pattern)
    const childImage = data.Image?.[0];
    
    // Remove the image from the data object
    delete data.Image;

    const payload = {
      ...data,
      archived: false,
    };

    try {
      // STAGE 2: Validate remaining data (no Image field)
      const validatedPayload = await generateChildSchema().validateAsync(payload);

      if (child) {
        // Update existing child
        updateChildMutation.mutate({ 
          validatedFormData: validatedPayload, 
          childImage
        });
      } else {
        // Create new child - need to create document first to get ID for photo upload
        const docRef = await addDoc(collection(db, "Children"), validatedPayload);
        const userRef = doc(collection(db, "Users"), currentUser.uid);
        await updateDoc(userRef, { Children: arrayUnion(docRef) });
        
        // Now upload photo with the new child ID
        if (childImage) {
          try {
            let PhotoURL = await dbService.uploadChildPhoto(docRef.id, childImage);
            await updateDoc(docRef, { PhotoURL });
          } catch (uploadError) {
            addAlert('error', `Photo upload failed: ${uploadError.message}`);
          }
        }
        
        queryClient.invalidateQueries(['fetchChildren', currentUser.Email]);
        reset();
        setOpenState(false);
        addAlert('success', 'Child registered successfully!');
      }
    } catch (error) {
      if (error.isJoi) {
        logger.error('Child registration failed validation:', error.details);
        addAlert('error', 'Please check your input and try again.');
      } else {
        logger.error('Error adding document: ', error);
        addAlert('error', `Registration failed: ${error.message}`);
      }
    }
  };

  return (
    <div className='container bg-white'>
      <h1 className="text-center pt-5">Child Registration</h1>
      <p className="text-center">Add your child here!</p>
      <div className="row d-flex justify-content-center">
        <form onSubmit={handleSubmit(onSubmit)} className='col-md-12'>
          <label htmlFor="Name" className="form-label">Name:</label>
          <input type="text" disabled={child?.Name} id="NameChild" {...register('Name')} className="form-control" />
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

          {/* Photo upload field */}
          <div className="mb-3">
            <label htmlFor="Image" className="form-label">Photo</label>
            <input
              type="file"
              id="Image"
              {...register("Image")}
              className="form-control"
              accept="image/*"
            />
            {errors.Image?.message && <p className="text-danger">{errors.Image.message}</p>}
          </div>

          <button type="submit" className="my-5 btn btn-primary login-btn w-100">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default ChildRegistration;