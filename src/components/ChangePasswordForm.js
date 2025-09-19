import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { joiResolver } from '@hookform/resolvers/joi';
import { generatePasswordSchema } from '../schemas/PasswordSchema';
import { logger } from '../Helpers/logger';
import { firebaseAuth } from '../config/firebaseAuth';
import { EmailAuthProvider } from "firebase/auth";
import { reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const ChangePasswordForm = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(generatePasswordSchema(true))
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      logger.info('Reauthenticating user:', user.email);
      // Reauthenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      logger.info('User reauthenticated successfully');

      // Update the password
      await updatePassword(user, newPassword);
      logger.info('Password updated successfully');
    } catch (error) {
      logger.error('Password update failed:', error.message);
      throw error;
    }
  };

  const changePasswordMutation = useMutation({
    mutationKey: ['changePassword'],
    mutationFn: async (data) => {
      return await updateUserPassword(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      logger.info('Password updated successfully');
      reset();
      setError(null);
      setSuccess('Password updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      logger.error('Failed to change password:', error.message);
      setError('Failed to change password. Please check your current password and try again.');
      setSuccess(null);
    }
  });

  const onSubmit = (data) => {
    setError(null);
    setSuccess(null);
    changePasswordMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="col-12 col-md-6 mt-3">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="mb-3">
        <label htmlFor="currentPassword" className="form-label">Current Password</label>
        <input
          type="password"
          id="currentPassword"
          className="form-control"
          {...register("currentPassword")}
        />
        {errors.currentPassword?.message && 
          <p className="text-danger">{errors.currentPassword.message}</p>}
      </div>
      
      <div className="mb-3">
        <label htmlFor="newPassword" className="form-label">New Password</label>
        <input
          type="password"
          id="newPassword"
          className="form-control"
          {...register("newPassword")}
        />
        {errors.newPassword?.message && 
          <p className="text-danger">{errors.newPassword.message}</p>}
      </div>
      
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
        <input
          type="password"
          id="confirmPassword"
          className="form-control"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message && 
          <p className="text-danger">{errors.confirmPassword.message}</p>}
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={changePasswordMutation.isPending}
      >
        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;
