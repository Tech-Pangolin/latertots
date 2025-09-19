import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { generateForgotPasswordSchema } from '../../schemas/PasswordSchema';
import { sendPasswordResetEmailToUser } from '../AuthProvider';
import { logger } from '../../Helpers/logger';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(generateForgotPasswordSchema())
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmailToUser(data.email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
      reset();
    } catch (error) {
      logger.error('Password reset request failed:', error);
      // Always show the same message for security (prevent email enumeration)
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container-fluid' style={{ background: `url('/assets/img/login/loginbg.png')`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }}>
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            <div className="login" style={{ width: '400px' }}>
              <h2 className="text-center mb-4" style={{ color: 'white' }}>Forgot Password</h2>
              
              {message && (
                <div className={`alert ${message.includes('sent') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    {...register("email")}
                    placeholder="Enter your email address"
                  />
                  {errors.email?.message && 
                    <span className="text-danger">{errors.email.message}</span>}
                </div>

                <div className="row">
                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="login-btn w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="text-center mt-5">
                <Link to="/login" className="text-decoration-none" style={{ color: '#007bff', paddingTop: '10px' }}>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
