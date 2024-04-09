import React from 'react';
import 'firebaseui/dist/firebaseui.css';
import { signInWithGoogle, signInWithEmail } from '../AuthProvider';
import { useForm } from 'react-hook-form';


function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      await signInWithEmail(data.email, data.password);
      // Redirect to "/" if sign-in is successful
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Login Page</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="email"
          {...register("email", { required: true })}
          placeholder="Email"
        />
        {errors.email && <span>Email is required</span>}
        
        <input
          type="password"
          {...register("password", { required: true })}
          placeholder="Password"
        />
        {errors.password && <span>Password is required</span>}
        
        <button type="submit">Log in</button>
      </form>

      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
}

  export default LoginPage;