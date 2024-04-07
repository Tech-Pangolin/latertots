import { db } from "../../config/firestore";
import React from "react";
import { useForm } from "react-hook-form";
import { collection, addDoc, doc } from "firebase/firestore";

const UserForm = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const onSubmit = async (data) => {
    // Hardcode a user role for now
    const userRoleRef = await doc(db, 'Roles', 'parent-user');
    data.Role = userRoleRef;

    try {
      const docRef = await addDoc(collection(db, 'Users'), data);
      console.log('Document written with ID: ', docRef.id);

      // Navigate back to the homepage on success
      window.location.href = '/';
    }
    catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  // Log form state as it is filled out
  // console.log(watch());

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
          {...register("Email", { required: "Email is required" })}
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
      <button type="submit">Create User</button>
    </form>
  );
};

export default UserForm;