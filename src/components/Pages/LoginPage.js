import React from 'react';
import {ui, uiConfig} from '../../config/firebaseUI';
import 'firebaseui/dist/firebaseui.css';

function LoginPage() {

  // To fix the issue of firebaseUI attempting to initiate before AuthProvider
  // has finished user checking, you could move the FirebaseUI initialization code
  // into a useEffect hook that runs after the component has mounted. 
  // This will ensure that the FirebaseUI widget doesn't try to initialize 
  // itself until its container element has been rendered.
  React.useEffect(() => {
    ui.start('#firebaseui-auth-container', uiConfig);
  }, []);

  return (
    <div>
      <h1>Login Page</h1>
      <div id='firebaseui-auth-container'></div>
    </div>
  );
}

export default LoginPage;