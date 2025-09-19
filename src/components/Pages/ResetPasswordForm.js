import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { generateResetPasswordSchema } from '../../schemas/PasswordSchema';
import { resetPasswordWithCode, useAuth } from '../AuthProvider';
import { logger } from '../../Helpers/logger';
import { Link, useNavigate } from 'react-router-dom';

const ResetPasswordForm = ({ oobCode }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(generateResetPasswordSchema(true))
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();


  const onSubmit = async (data) => {
    if (!oobCode) {
      setMessage('Invalid reset code. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await resetPasswordWithCode(oobCode, data.newPassword);
      setMessage('Password reset successfully! You are now signed in.');
      reset();

      // Auto-redirect based on user role after 2 seconds
      setTimeout(() => {
        if (currentUser) {
          if (currentUser.Role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/profile');
          }
        } else {
          // Fallback to login if user context isn't available yet
          navigate('/login');
        }
      }, 2000);
    } catch (error) {
      logger.error('Password reset failed:', error);
      if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
        setMessage('This reset link is invalid or has expired. Please request a new password reset.');
      } else {
        setMessage('Failed to reset password. Please try again or request a new reset link.');
      }
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
              <h2 className="text-center mb-4" style={{ color: 'white' }}>Reset Password</h2>

              {message && (
                <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}

              {oobCode ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      {...register("newPassword")}
                      placeholder="Enter your new password"
                    />
                    {errors.newPassword?.message &&
                      <span className="text-danger">{errors.newPassword.message}</span>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      {...register("confirmPassword")}
                      placeholder="Confirm your new password"
                    />
                    {errors.confirmPassword?.message &&
                      <span className="text-danger">{errors.confirmPassword.message}</span>}
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <button
                        type="submit"
                        className="login-btn w-100"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <p style={{ color: 'white' }}>No valid reset code found.</p>
                  <Link to="/forgot-password" className="register-btn w-100 mb-3 mt-3 text-center">
                    Request New Reset Link
                  </Link>
                </div>
              )}

              <div className="text-center mt-3">
                <Link to="/login" className="text-decoration-none" style={{ color: '#007bff' }}>
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

export default ResetPasswordForm;
