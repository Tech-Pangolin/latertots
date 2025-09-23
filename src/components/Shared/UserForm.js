import { db } from "../../config/firestore";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc } from "firebase/firestore";
import { signInWithGoogle, useAuth } from "../AuthProvider";
import { firebaseAuth } from "../../config/firebaseAuth";
import { logger, setLogLevel, LOG_LEVELS } from "../../Helpers/logger";
import { useMutation } from "@tanstack/react-query";
import { FirebaseDbService } from "../../Helpers/firebase";
import { joiResolver } from "@hookform/resolvers/joi";
import { generateUserProfileSchema } from "../../schemas/UserProfileSchema";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "../ChangePasswordForm";
import GoogleIcon from "./GoogleIcon";
import { ALERT_TYPES } from "../../Helpers/constants";

const UserForm = ({ addAlert }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(generateUserProfileSchema(true)),
  });
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);
  const [email, setEmail] = React.useState(currentUser ? currentUser.Email : '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [mode, setMode] = React.useState(currentUser ? 'update' : 'create');
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();


  setLogLevel(LOG_LEVELS.DEBUG);

  useEffect(() => {
    if (currentUser) {
      setDbService(new FirebaseDbService(currentUser));
      setMode('update');
      // Reset form with only applicable fields
      reset({
        Name: currentUser.Name || '',
        Email: currentUser.Email || '',
        CellNumber: currentUser.CellNumber || '',
        StreetAddress: currentUser.StreetAddress || '',
        City: currentUser.City || '',
        State: currentUser.State || '',
        Zip: currentUser.Zip || ''
      });
      
      // Redirect authenticated users from registration page to profile page
      logger.info("User is authenticated, redirecting to profile page");
      navigate('/profile');
    } else {
      setDbService(new FirebaseDbService({}));
      setMode('create');
    }
  }, [currentUser, navigate, reset]);

  const createUserMutation = useMutation({
    mutationKey: ['createUser'],
    mutationFn: async (userData) => {
      if (!dbService) throw new Error("Database service is not initialized");
      return await dbService.createUserAndAuthenticate(firebaseAuth, userData.email, userData.password);
    },
    onSuccess: (user) => {
      logger.info('User created successfully:', user);
      window.location.href = '/profile';
    },
    onError: (error) => {
      logger.error('Failed to create user:', error.message);
      setError(error.message);
    }
  })

  const createUserOnSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setPasswordMismatch(true);
      return;
    } else {
      createUserMutation.mutate({ email, password });
      // Clear error and password mismatch state if set
      setPasswordMismatch(false);
      setError(null);
    }
  };

  const updateUserMutation = useMutation({
    mutationKey: ['updateUser'],
    mutationFn: async ({ validatedFormData, userImage }) => {
      if (!dbService) throw new Error("Database service is not initialized");
      const userDocRef = doc(db, 'Users', currentUser.uid);
      
      if (userImage) {
        try {
          let PhotoURL = await dbService.uploadProfilePhoto(currentUser.uid, userImage);
          // Add the PhotoURL to the user document data
          validatedFormData.PhotoURL = PhotoURL;
        } catch (uploadError) {
          // Re-throw with a more user-friendly message for photo upload failures
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
      }
      
      await updateDoc(userDocRef, validatedFormData);
    },
    onSuccess: () => {
      logger.info('User updated successfully');
      addAlert(ALERT_TYPES.SUCCESS, 'Profile updated successfully!');
      setError(null);
    },
    onError: (error) => {
      logger.error('Failed to update user:', error.message);
      addAlert(ALERT_TYPES.ERROR, `Update failed: ${error.message}`);
      setError(error.message);
    }
  })

  const updateUserOnSubmit = async (data) => {
    // Extract the image before deleting it
    const userImage = data.Image?.[0];
    
    // Remove the image from the data object - safely handle cases where no image is selected
    delete data.Image;
    delete data.Photo;

    // Remove the password from the data object
    const dataWithoutPassword = { ...data };
    delete dataWithoutPassword.Password;

    // EXPLICITLY filter to only include the fields we want to update
    const allowedFields = ['Name', 'Email', 'CellNumber', 'StreetAddress', 'City', 'State', 'Zip'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (dataWithoutPassword[field] !== undefined) {
        filteredData[field] = dataWithoutPassword[field];
      }
    });

    try {
      const validatedFormData = await generateUserProfileSchema(true).validateAsync(filteredData);
      updateUserMutation.mutate({ validatedFormData, userImage });
    } catch (e) {
      logger.error('Error adding/updating document: ', e.message);
      logger.error('Stack Trace:', e.stack);
    }

  };

  return (
    <div className="container" style={{}}>
      <div className="row">
        {/* <div className="col register-form"> */}

          {/* Create User Form */}
          {(mode === "create") &&
          <div className="d-flex justify-content-center">
            <form onSubmit={createUserOnSubmit} >
              <div className="mb-3 col-12">
                <label htmlFor="email" className="form-label">Email:</label>
                <input className="form-control"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3 col-12">
                <label htmlFor="password" className="form-label">Password:</label>
                <input className="form-control"
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3 col-12">
                <label htmlFor="confirm" className="form-label">Confirm Password:</label>
                <input className="form-control"
                  type="password"
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              {passwordMismatch && <p>Passwords do not match</p>}
              {error && <p className="mt-3">{error}</p>}
              <div className="row ">
                <div className="col-12 my-3"> 
                  <button 
                    type="submit" 
                    className="register-btn w-100"
                    disabled={createUserMutation.isLoading}
                  >
                    {createUserMutation.isLoading ? 'Creating...' : 'Sign Up'}
                  </button>
                </div>
                <div className="text-center my-3 or">or</div>
                <div className="col-12 my-3"> 
                  <button 
                    onClick={signInWithGoogle} 
                    className="google-btn w-100" 
                    type="button"
                    disabled={createUserMutation.isLoading}
                  >
                    <GoogleIcon size={16} />
                    <span className="ms-2">Sign up with Google</span>
                  </button>
                </div>
              </div>
              {/* <div className="d-flex justify-content-center">


              </div> */}
            </form>
            </div>
          }

          {/* Update User Form */}
          {(mode === "update") && (
            <form onSubmit={handleSubmit(updateUserOnSubmit)} className="row">
              <div className="mb-3">
                <label htmlFor="Name" className="form-label">Name *</label>
                <input type="text" className="form-control" {...register("Name")} />
                {errors.Name?.message && <div className="">{errors.Name.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="Email" className="form-label">Email</label>
                <input
                  className="form-control"
                  type="Email"
                  disabled={mode === 'update'}
                  {...register("Email")}
                />
                {errors.Email?.message && <p>{errors.Email.message}</p>}
              </div>
              <div className="col-10 mb-3">
                <label htmlFor="Image" className="form-label">Photo</label>
                <input
                  type="file"
                  {...register("Image")}
                  className="form-control"
                />
                {errors.Image?.message && <p>{errors.Image.message}</p>}
              </div>
              <div className="mb-3  col-4">
                <label htmlFor="CellNumber" className="form-label">Cell #</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("CellNumber")}
                />
                {errors.CellNumber?.message && <p>{errors.CellNumber.message}</p>}
              </div>

              <div className="mb-3 col-6">
                <label htmlFor="StreetAddress" className="form-label">Street Address</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("StreetAddress")}
                />
                {errors.StreetAddress?.message && <p>{errors.StreetAddress.message}</p>}
              </div>
              <div className="mb-3 col-4">
                <label htmlFor="City" className="form-label">City</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("City")}
                />
                {errors.City?.message && <p>{errors.City.message}</p>}
              </div>
              <div className="mb-3 col-4">
                <label htmlFor="State" className="form-label">State</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("State")}
                />
                {errors.State?.message && <p>{errors.State.message}</p>}
              </div>
              <div className="mb-3 col-2">
                <label htmlFor="Zip" className="form-label">Zip</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("Zip")}
                />
                {errors.Zip?.message && <p>{errors.Zip.message}</p>}
              </div>
              <div className="col-12">
                <button 
                  type="submit" 
                  className="btn btn-primary mt-5 register-start"
                  disabled={updateUserMutation.isLoading}
                >
                  {updateUserMutation.isLoading ? 'Updating...' : (mode === 'create' ? "Create" : "Update") + " User"}
                </button>
              </div>
            </form>)}
        {/* </div> */}
      </div>
      {/* {mode === 'update' && ( */}
        {/* // <div className="row">
        //   <h5 className="mt-5">Change Password</h5>
        //   <ChangePasswordForm />
        // </div> */}
      {/* )} */}
    </div>
  );
};

export default UserForm;