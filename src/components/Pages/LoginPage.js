import React, { useEffect } from 'react';
import 'firebaseui/dist/firebaseui.css';
import { signInWithGoogle, signInWithEmail, useAuth } from '../AuthProvider';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import GoogleIcon from '../Shared/GoogleIcon';


function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.Role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    }
  }, [currentUser, navigate]);

  const onSubmit = async ({ email, password }, e) => {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='container-fluid' style={{ background: `url('/assets/img/login/loginbg-fw.png')`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', minHeight: '100vh' }}>
      <div className="container">
        <div className="row">
          <div className="col d-flex justify-content-center mt-3">
            <img src="/assets/img/login/playandstay.png" className="img-fluid play-stay" alt="" />
          </div>
        </div>
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            {/* <h5 className='text-center registration' >Login Coming Soon</h5> */}
            <form onSubmit={handleSubmit(onSubmit)} className="login" style={{ width: '400px' }} >
              <div className="mb-2">
                <label className="form-label">Email</label>
                <input className="form-control" id="email" placeholder="user@example.com" type="email"
                  {...register("email", { required: true })} />
                {errors.email && <span>Email is required</span>}
              </div>
              <div className="mb-2">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" id="password" placeholder="xxxxxxxxx"   {...register("password", { required: true })} />
                {errors.password && <span>Password is required</span>}
              </div>

              <div className="mb-2 text-end">
                <Link to="/forgot-password" className="text-decoration-none small text-muted">
                  Forgot Password?
                </Link>
              </div>

              <div className="row">
                <div className='col-12'> <button type="submit" className="login-btn w-100">Login</button></div>
              </div>
              <div className='row'>
                <div className='col-12'>
                  <button onClick={handleGoogleSignIn} className="google-btn w-100 mt-2" type="button">
                    <GoogleIcon size={16} />
                    <span className="ms-2">Sign in with Google</span>
                  </button>
                </div>
              </div>
              <div className='row'>
                <div className='col-12'>
                  <a href="/register" className="register-btn w-100 text-center my-2" type="button">
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