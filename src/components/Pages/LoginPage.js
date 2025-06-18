import React, { useEffect } from 'react';
import 'firebaseui/dist/firebaseui.css';
import { signInWithGoogle, signInWithEmail, useAuth } from '../AuthProvider';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';


function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.Role === 'admin') {
        navigate('/admin');
      }
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const onSubmit = async ({ email, password }, e) => {
    try {
      console.log("WTF", email, password)
      await signInWithEmail(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='container-fluid ' style={{ background: `url('assets/img/login/loginbg.png')`, backgroundSize: 'cover', width: '100%', height: '100%' }}>
      <div className="container">
        <div className="row ">
          <div className="col d-flex justify-content-center mt-5">
            <img src="assets/img/login/playandstay.png" className="img-fluid play-stay" alt="" />
          </div>
        </div>
        <div className="row">
          <div className="col-12 d-flex justify-content-center">

            <form onSubmit={handleSubmit(onSubmit)} className="login" style={{ width: '400px' }} >
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" id="email" placeholder="user@example.com" type="email"
                  {...register("email", { required: true })} />
                {errors.email && <span>Email is required</span>}
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" id="password" placeholder="xxxxxxxxx"   {...register("password", { required: true })} />
                {errors.password && <span>Password is required</span>}
              </div>

              <div className="row">
                <div className='col-12'> <button type="submit" className="login-btn w-100">Login</button></div>
                {/* <div className='col-12 col-md-1 text-centerm d-flex justify-content-center align-items-center'>  <span className="mx-1"> or </span></div> */}
              </div>
              <div className='row'>
                <div className='col-12'>
                  <a href="/register" className="register-btn w-100 mb-5 mt-3 text-center" type="button">
                    Register
                  </a>
                </div>
              </div>
            </form>
          </div>
          {/* <div className='col-2'>
            <img src="assets/img/shapes.png" className="page-img" />
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;