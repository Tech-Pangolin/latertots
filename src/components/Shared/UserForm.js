import { db } from "../../config/firestore";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../AuthProvider";
import { uploadProfilePhoto, fetchCurrentUser, createUserAndAuthenticate, pollForUserDocument } from "../../Helpers/firebase";
import { firebaseAuth } from "../../config/firebaseAuth";
import { logger, setLogLevel, LOG_LEVELS } from "../../Helpers/logger";
import ChangePasswordForm from "../ChangePasswordForm";

const UserForm = ({ reloadUserData }) => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { currentUser } = useAuth();
  logger.info("CurrentUser: ", currentUser)
  const [email, setEmail] = React.useState(currentUser?.email ?? '');
  const [authUserId, setAuthUserId] = React.useState(null);
  const [mode, setMode] = React.useState('create');

   setLogLevel(LOG_LEVELS.DEBUG);

  useEffect(() => {
    if (email && email !== '') {
      fetchCurrentUser(email, currentUser?.uid).then((resp) => {
        logger.info("Fetched new current user: ", resp); 
        setAuthUserId(resp.id)
      }).catch((e) => logger.error(e));

      const fetchData = async () => {
        if (authUserId) {
          const userDocRef = doc(db, 'Users', authUserId);
          const userDoc = await getDoc(userDocRef);
          logger.info(userDoc)
          if (userDoc.exists()) {
            reset(userDoc.data());
            setMode('update');
          } else {
            logger.info("No such user found!");
          }
        }
      };
      fetchData();
    }
  }, [email, reset, authUserId]);

  const onSubmit = async (data) => {
    // Hardcode a user role for now
    const userRoleRef = await doc(db, 'Roles', 'parent-user');
    data.Role = userRoleRef;

    // Remove the image from the data object
    const userImage = data.Image[0];
    delete data.Image;
    delete data.Photo;

    // Remove the password from the data object
    const dataWithoutPassword = {...data};
    delete dataWithoutPassword.Password;


    try {
      logger.info('Mode:', mode);
      logger.info('Data:', data);

      if (mode === 'create') {
          logger.info('Creating user...');
          const user = await createUserAndAuthenticate(firebaseAuth, data.Email, data.Password);
          logger.info('User created:', user);
          // An empty document will be created in the Users collection by the Firebase Auth trigger

          // Poll for the user document to be created by the Firebase Auth trigger
          // Limit 10 retries
          logger.info('Polling for user document...');
          let userDocRef = await pollForUserDocument(db, user.uid, 10);
          logger.info('User document found:', await getDoc(userDocRef));
          logger.info('Setting email for logged in user:', data.Email)
          if (userDocRef) {
              setEmail(data.Email);
          }
          logger.info('Email set')

          
          // Upload the profile photo if one was provided
          logger.info('Uploading profile photo...');
          let photoURL = await uploadProfilePhoto(user.uid, userImage);
          logger.info('Photo URL:', photoURL);
          // Add the photoURL to the user document data
          dataWithoutPassword.PhotoURL = photoURL;
          logger.info('Updating user document:', dataWithoutPassword);
          await updateDoc(userDocRef, dataWithoutPassword);
          logger.info('User document updated.');

          // Navigate back to the homepage on success
          window.location.href = '/profile';

      } else if (mode === 'update' && authUserId) {
          logger.info('Updating user...');
          const userDocRef = doc(db, 'Users', authUserId);
          logger.info('data before photo update:', dataWithoutPassword)
          if (userImage) {
              logger.info('Uploading profile photo...');
              dataWithoutPassword.PhotoURL = await uploadProfilePhoto(authUserId, userImage);
              logger.info('Photo URL:', dataWithoutPassword.PhotoURL);
          }
          logger.info('Updating user document:', dataWithoutPassword);
          await updateDoc(userDocRef, dataWithoutPassword);
          logger.info('User document updated.');

          reloadUserData[1](!reloadUserData[0]);
      }
  } catch (e) {
      logger.error('Error adding/updating document: ', e.message);
      logger.error('Stack Trace:', e.stack);
  }
  
  };

  return (
    <div className="container">
      <div className="row">
        <form onSubmit={handleSubmit(onSubmit)} className="col-12 col-md-6">
          <div className="mb-3">
            <label htmlFor="Name" className="form-label">Name</label>
            <input type="text" className="form-control" {...register("Name", { required: "Name is required" })} />
            {errors.Name && <div className="">{errors.Name.message}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="Email" className="form-label">Email</label>
            <input
              className="form-control"
              type="Email"
              disabled={mode === 'update'}
              {...register("Email")}
            />
            {errors.Email && <p>{errors.Email.message}</p>}
          </div>

          {mode === 'create' && (
            <div className="mb-3">
              <label htmlFor="Password" className="form-label">Password</label>
              <input
                className="form-control"
                type="Password"
                {...register("Password", { required: "Password is required" })}
                disabled={mode === 'update'}
              />
              {errors.Password && <p>{errors.Password.message}</p>}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="CellNumber"  className="form-label">Cell #</label>
            <input
            className="form-control"
              type="text"
              {...register("CellNumber", { required: "Cell is required" })}
            />
            {errors.CellNumber && <p>{errors.CellNumber.message}</p>}
          </div>
          <div className="mb-3">
            <label htmlFor="StreetAddress" className="form-label">Street Address</label>
            <input
             className="form-control"
              type="text"
              {...register("StreetAddress", { required: "Street Address is required" })}
            />
            {errors.StreetAddress && <p>{errors.StreetAddress.message}</p>}
          </div>
          <div className="mb-3">
            <label htmlFor="City" className="form-label">City</label>
            <input
              className="form-control"
              type="text"
              {...register("City", { required: "City is required" })}
            />
            {errors.City && <p>{errors.City.message}</p>}
          </div>
          <div className="mb-3">
            <label htmlFor="State" className="form-label">State</label>
            <input
              className="form-control"
              type="text"
              {...register("State", { required: "State is required" })}
            />
            {errors.State && <p>{errors.State.message}</p>}
          </div>
          <div className="mb-3">
            <label htmlFor="Zip" className="form-label">Zip</label>
            <input
              className="form-control"
              type="text"
              {...register("Zip", { required: "Zip is required" })}
            />
            {errors.Zip && <p>{errors.Zip.message}</p>}
          </div>
          <div>
            <label htmlFor="Image">Image</label>
            <input 
              type="file" 
              {...register("Image")} 
              className="form-control"
            />
            {errors.Image && <p>{errors.Image.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary mt-5">{mode === 'create' ? "Create" : "Update"} User</button>
        </form>
      </div>
      { mode === 'update' && (
        <div className="row">
          <h5 className="mt-5">Change Password</h5>
          <ChangePasswordForm reloadUserData={reloadUserData} />
        </div>
      )}
    </div>
  );
};

export default UserForm;