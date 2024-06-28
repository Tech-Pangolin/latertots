import React from 'react';
import { useForm } from 'react-hook-form';
import { logger } from '../Helpers/logger';
import { firebaseAuth } from '../config/firebaseAuth';
import { setLogLevel, LOG_LEVELS } from '../Helpers/logger';
import { EmailAuthProvider } from "firebase/auth";
import { reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const ChangePasswordForm = ({ reloadUserData }) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch, reset } = useForm();
  const newPassword = watch("newPassword");

  setLogLevel(LOG_LEVELS.DEBUG);

  const onSubmit = async (data) => {
    const { currentPassword, newPassword } = data;

    try {
      const currentUser = firebaseAuth.currentUser;
      logger.info('Current User: ', currentUser);
      if (currentUser) {
        logger.info('There is a current user: ', currentUser.email)
        // Reauthenticate the user
        const credential = await EmailAuthProvider.credential(currentUser.email, currentPassword);
        logger.info('Credential: ', credential);
        await reauthenticateWithCredential(currentUser, credential).then(() => {
          logger.info('User reauthenticated successfully.');
        }).catch((e) => {
          logger.error('Error in reauthenticateWithCredential: ', e.message);
          throw new Error('Could not reauthenticate user');
        });

        // Update the password
        await updatePassword(currentUser, newPassword).then(() => {
          logger.info('Password updated successfully.');
        }).catch((e) => {
          logger.error('Error in updatePassword: ', e.message);
          throw new Error('Could not update password');
        });

      } else {
        throw new Error('Could not update password.');
      }

      logger.info('Password updated successfully.');
      reset();
      reloadUserData[1](!reloadUserData[0]);
    } catch (e) {
      logger.error('Failed to change password: ', e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="col-12 col-md-6 mt-3">
      <div className="mb-3">
        <label htmlFor="currentPassword" className="form-label">Current Password</label>
        <input
          type="password"
          className="form-control"
          {...register("currentPassword", { required: "Current Password is required" })}
        />
        {errors.currentPassword && <div>{errors.currentPassword.message}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="newPassword" className="form-label">New Password</label>
        <input
          type="password"
          className="form-control"
          {...register("newPassword", { required: "New Password is required" })}
        />
        {errors.newPassword && <div>{errors.newPassword.message}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
        <input
          type="password"
          className="form-control"
          {...register("confirmPassword", {
            required: "Please confirm your new password",
            validate: value =>
              value === newPassword || "The passwords do not match"
          })}
        />
        {errors.confirmPassword && <div>{errors.confirmPassword.message}</div>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={!isValid}>Change Password</button>
    </form>
  );
};

export default ChangePasswordForm;
