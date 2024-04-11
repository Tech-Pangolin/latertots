import { db } from "../../config/firestore";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../AuthProvider";
import { uploadProfilePhoto, fetchCurrentUser } from "../../Helpers/firebase";

const UserForm = () => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { currentUser: { email } } = useAuth();
  const [authUserId, setAuthUserId] = React.useState(null);
  const [mode, setMode] = React.useState('create');

  useEffect(() => { 
    fetchCurrentUser(email).then((resp) => setAuthUserId(resp.id));

    const fetchData = async () => {
      if (authUserId) {
        const userDocRef = doc(db, 'Users', authUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          reset(userDoc.data());
          setMode('update');
        } else {
          console.log("No such user found!");
        }
      }
    };
    fetchData();
  }, [email, reset, authUserId]);

  const onSubmit = async (data) => {
    // Hardcode a user role for now
    const userRoleRef = await doc(db, 'Roles', 'parent-user');
    data.Role = userRoleRef;
    data.Email = email;
    const userImage = data.Image[0];
    delete data.Image;

    try {
      if (mode === 'create') {
        await addDoc(collection(db, 'Users'), data);
      } else if (mode === 'update' && authUserId) {
        const userRef = doc(db, 'Users', authUserId);
        await updateDoc(userRef, data);
      }

      if (userImage) {
        await uploadProfilePhoto(authUserId, userImage);
      }

      // Navigate back to the homepage on success
      window.location.href = '/';
    }
    catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  // Log form state as it is filled out
   console.log(watch());

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="Name">Name</label>
        <input type="text" {...register("Name", { required: "Name is required" })} />
        {errors.Name && <p>{errors.Name.message}</p>}
      </div>
      <div>
        <label htmlFor="Email">Email</label>
        <input
          type="Email"
          value={email}
          disabled
          {...register("Email")}
        />
        {errors.Email && <p>{errors.Email.message}</p>}
      </div>
      <div>
        <label htmlFor="CellNumber">Cell #</label>
        <input
          type="text"
          {...register("CellNumber", { required: "Cell is required" })}
        />
        {errors.CellNumber && <p>{errors.CellNumber.message}</p>}
      </div>
      <div>
        <label htmlFor="StreetAddress">Street Address</label>
        <input
          type="text"
          {...register("StreetAddress", { required: "Street Address is required" })}
        />
        {errors.StreetAddress && <p>{errors.StreetAddress.message}</p>}
      </div>
      <div>
        <label htmlFor="City">City</label>
        <input
          type="text"
          {...register("City", { required: "City is required" })}
        />
        {errors.City && <p>{errors.City.message}</p>}
      </div>
      <div>
        <label htmlFor="State">State</label>
        <input
          type="text"
          {...register("State", { required: "State is required" })}
        />
        {errors.State && <p>{errors.State.message}</p>}
      </div>
      <div>
        <label htmlFor="Zip">Zip</label>
        <input
          type="text"
          {...register("Zip", { required: "Zip is required" })}
        />
        {errors.Zip && <p>{errors.Zip.message}</p>}
      </div>
      <div>
        <label htmlFor="Image">Image</label>
        <input type="file" {...register("Image")} />
        {errors.Image && <p>{errors.Image.message}</p>}
      </div>
      <button type="submit">{ mode === 'create' ? "Create" : "Update"} User</button>
    </form>
  );
};

export default UserForm;