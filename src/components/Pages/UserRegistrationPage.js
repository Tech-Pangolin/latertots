import React from 'react';
import UserForm from '../Shared/UserForm';

function UserRegistrationPage() {
  
  return (
<div className="container">
<div className="row content">
          <div className="col-md-6 order-1 order-md-2" dataAos="fade-left">
            <img src="assets/img/kids.jpg" className="img-fluid mt-5" alt=""/>
          </div>
          <div className="col-md-6 pt-5 order-2 order-md-1" dataAos="fade-up">
            <h2>User Registration</h2>
            <h3>Sign up with us to schedule</h3>
            <p className="fst-italic">
            Register a new user here!</p>
      <UserForm />
          
          </div>
        </div>
    </div>
    // <div className="container">
    //   <h1>User Registration</h1>
    //   <div className='row'>
    //   <div className='col-6'>
    //   <p>Register a new user here!</p>
    //   <UserForm />
    //   </div>
    //   <div className='col-6'>
    //     </div>
    //     </div>
    // </div>
  );
}

export default UserRegistrationPage;