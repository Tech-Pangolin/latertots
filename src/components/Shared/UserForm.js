import { db } from "../../config/firestore";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../AuthProvider";
import { uploadProfilePhoto, fetchCurrentUser } from "../../Helpers/firebase";
import { create } from "@mui/material/styles/createTransitions";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "../../config/firebaseAuth";

const UserForm = () => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { currentUser } = useAuth();
  console.log("CurrentUser: ", currentUser)
  const [email,setEmail] = currentUser?.email ?? '';
  // const email = "";
  const [authUserId, setAuthUserId] = React.useState(null);
  const [mode, setMode] = React.useState('create');

  useEffect(() => {
    if (email && email !== '') {
      fetchCurrentUser(email).then((resp) => setAuthUserId(resp.id)).catch((e) => console.error(e));

      const fetchData = async () => {
        if (authUserId) {
          const userDocRef = doc(db, 'Users', authUserId);
          const userDoc = await getDoc(userDocRef);
          console.log(userDoc)
          if (userDoc.exists()) {
            reset(userDoc.data());
            setMode('update');
          } else {
            console.log("No such user found!");
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
    // data.Email = email;
    //const userImage = data.Image[0];
    delete data.Image;

    const dataWithoutPassword = {...data};
    delete dataWithoutPassword.Password;


    try {
      console.log(mode,data)
      let docRef;
      if (mode === 'create') {
        // TODO: check if email already exists
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.Email, data.Password);
        const user = userCredential.user;
        // An empty document will be created in the Users collection by the Firebase Auth trigger

        // Poll for the user document to be created by the Firebase Auth trigger
        // Limit 10 retries
        let userDocRef;
        for (let i = 0; i < 10; i++) {
          userDocRef = doc(db, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            break;
          }
          // Increase delay between retries
          await new Promise(r => setTimeout(r, 1000 * i));
        }

        await updateDoc(userDocRef, dataWithoutPassword);
        console.log("user created")
      } else if (mode === 'update' && authUserId) {
        const userRef = doc(db, 'Users', authUserId);
        await updateDoc(userRef, data);
      }

      // TODO: Add user image upload
      // if (userImage) {
      //   await uploadProfilePhoto(authUserId?? docRef.id, userImage);
      // }

      // Navigate back to the homepage on success
      //window.location.href = '/';
    }
    catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  // Log form state as it is filled out
  // console.log(watch());

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
            <input type="file" {...register("Image")} className="form-control"/>
            {errors.Image && <p>{errors.Image.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary mt-5">{mode === 'create' ? "Create" : "Update"} User</button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;