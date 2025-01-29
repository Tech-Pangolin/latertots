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
      if (currentUser.role === 'admin') {
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
    <div className='container-fluid ' style={{ background: `url('assets/img/login/loginbg.png')`, backgroundSize: 'cover', width: '100%', height: '725px' }}>
      <div className="container">
        <div className="row ">
          <div className="col d-flex justify-content-center mt-5">
            <img src="assets/img/login/playandstay.png" className="img-fluid" alt="" style={{ width: '30%', marginTop: "80px" }} />
          </div>
        </div>
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            {/* <div className="section-title" dataAos="fade-up">
              <h2>Login Page</h2>
              <p sx={{ color: '#3B38DA' }}>Access your account, manage your schedule, and keep up with your tot’s fun-filled days at Later Tots.</p>
            </div> */}

            <form onSubmit={handleSubmit(onSubmit)} className="login" style={{width:'400px'}} >
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



              <button type="submit" className="btn btn-primary">Log in</button>
              <span className="mx-5"> or </span>

              <button onClick={signInWithGoogle} className="btn bsb-btn-xl btn-outline-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                  <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                </svg>
                <span className="ms-2 fs-6">Sign in with Google</span>
              </button>
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