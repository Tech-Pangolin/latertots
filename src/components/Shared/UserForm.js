import { db } from "../../config/firestore";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { signInWithGoogle, useAuth } from "../AuthProvider";
import { FirebaseDbService } from "../../Helpers/firebase";
import { firebaseAuth } from "../../config/firebaseAuth";
import { logger, setLogLevel, LOG_LEVELS } from "../../Helpers/logger";
import ChangePasswordForm from "../ChangePasswordForm";

const UserForm = ({ reloadUserData }) => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { currentUser } = useAuth();
  const [email, setEmail] = React.useState(currentUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [authUserId, setAuthUserId] = React.useState(null);
  const [mode, setMode] = React.useState('create');
  const [hasAccount, setHasAccount] = React.useState(false);
  const [userRef, setUserRef] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  setLogLevel(LOG_LEVELS.DEBUG);

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        const userDocRef = doc(db, 'Users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          reset(userDoc.data());
          setMode('update');
          setHasAccount(true);
          setAuthUserId(currentUser.uid);
        } else {
          logger.error("No such user found!");
        }
      };
      fetchData();
    }
  }, [reset, authUserId]);

  const createUser = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    try {
      if (password === confirm) {
        const user = await dbService.createUserAndAuthenticate(firebaseAuth, email, password);
        setHasAccount(true);
        setUserRef(user);

        window.location.href = '/profile';
      } else {
        setPasswordMismatch(true);
      }
    } catch (e) {
      logger.error('Failed to create user:', e.message)
      setError(e.message)
    }

  };


  const onSubmit = async (data) => {
    // Hardcode a user role for now
    const userRoleRef = await doc(db, 'Roles', 'parent-user');
    data.Role = userRoleRef;
    data.archived = false;

    // Remove the image from the data object
    const userImage = data.Image[0];
    delete data.Image;
    delete data.Photo;

    // Remove the password from the data object
    const dataWithoutPassword = { ...data };
    delete dataWithoutPassword.Password;

    logger.info('Submit Mode:', mode);
    try {
      logger.info('Form Data:', data);

      // If user is already authenticated, get uid from auth token
      const user = userRef || currentUser;

      const userDocRef = doc(db, 'Users', user.uid);
      if (userImage) {
        let photoURL = await dbService.uploadProfilePhoto(user.uid, userImage);
        // Add the photoURL to the user document data
        dataWithoutPassword.PhotoURL = photoURL;
      }
      await updateDoc(userDocRef, dataWithoutPassword);

      // Navigate on success
      window.location.href = '/profile';

    } catch (e) {
      logger.error('Error adding/updating document: ', e.message);
      logger.error('Stack Trace:', e.stack);
    }

  };

  return (
    <div className="container" style={{}}>
      <div className="row justify-content-center">
        <div className="col register-form">
          {!hasAccount && <form onSubmit={createUser} className="row">
            <div className="mb-3 col-12 col-md-6">
              <label htmlFor="email" className="form-label">Email:</label>
              <input className="form-control"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 col-12 col-md-6">
              <label htmlFor="password" className="form-label">Password:</label>
              <input className="form-control"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
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
              <div className="col-12 col-md-6 mt-3"> <button type="submit" className="register-btn w-100">Sign Up</button></div>
              <div className="col-12 col-md-6 mt-3"> <button onClick={signInWithGoogle} className="google-btn w-100" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                    </svg>
                    <span className="ms-2">Sign up with Google</span>
                  </button></div>
            </div>
            <div className="d-flex justify-content-center">
             
              
            </div>
          </form>}
          {hasAccount && (
            <form onSubmit={handleSubmit(onSubmit)} className="row">
              {/* <div className="mb-3">
              <label htmlFor="Name" className="form-label">Name *</label>
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
            </div> */}

              {/* {mode === 'create' && (
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
          )} */}
              <div className="col-10 mb-3">
                <label htmlFor="Image" className="form-label">Photo</label>
                <input
                  type="file"
                  {...register("Image")}
                  className="form-control"
                />
                {errors.Image && <p>{errors.Image.message}</p>}
              </div>
              {/* <div className="col-6"></div> */}
              <div className="mb-3  col-4">
                <label htmlFor="CellNumber" className="form-label">Cell #</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("CellNumber", { required: "Cell is required" })}
                />
                {errors.CellNumber && <p>{errors.CellNumber.message}</p>}
              </div>

              <div className="mb-3 col-6">
                <label htmlFor="StreetAddress" className="form-label">Street Address</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("StreetAddress", { required: "Street Address is required" })}
                />
                {errors.StreetAddress && <p>{errors.StreetAddress.message}</p>}
              </div>
              <div className="mb-3 col-4">
                <label htmlFor="City" className="form-label">City</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("City", { required: "City is required" })}
                />
                {errors.City && <p>{errors.City.message}</p>}
              </div>
              <div className="mb-3 col-4">
                <label htmlFor="State" className="form-label">State</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("State", { required: "State is required" })}
                />
                {errors.State && <p>{errors.State.message}</p>}
              </div>
              <div className="mb-3 col-2">
                <label htmlFor="Zip" className="form-label">Zip</label>
                <input
                  className="form-control"
                  type="text"
                  {...register("Zip", { required: "Zip is required" })}
                />
                {errors.Zip && <p>{errors.Zip.message}</p>}
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary mt-5  register-start">{mode === 'create' ? "Create" : "Update"} User</button></div>
            </form>)}
        </div>
      </div>
      {/* {mode === 'update' && (
        <div className="row">
          <h5 className="mt-5">Change Password</h5>
          <ChangePasswordForm reloadUserData={reloadUserData} />
        </div>
      )} */}
    </div>
  );
};

export default UserForm;