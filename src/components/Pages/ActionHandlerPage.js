import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm';
import { logger } from '../../Helpers/logger';

const ActionHandlerPage = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode') || 'resetPassword';

  // Handle password reset action
  if (mode === 'resetPassword' && oobCode) {
    return <ResetPasswordForm oobCode={oobCode} />;
  }

  // Handle invalid or missing parameters
  return (
    <div className='container-fluid' style={{ background: `url('/assets/img/login/loginbg.png')`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }}>
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            <div className="login" style={{ width: '400px' }}>
              <h2 className="text-center mb-4" style={{ color: 'white' }}>Invalid Action</h2>
              <div className="alert alert-danger">
                <p>This link is invalid or has expired. Please request a new password reset.</p>
              </div>
              <div className="text-center mt-3">
                <a href="/forgot-password" className="text-decoration-none" style={{ color: '#007bff' }}>
                  Request New Reset Link
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionHandlerPage;
