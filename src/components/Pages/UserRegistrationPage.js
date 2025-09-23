import React from 'react';
import UserForm from '../Shared/UserForm';

function UserRegistrationPage() {

  return (
    <div className="container">
      <div className="row content">
        <div className="col order-2 order-md-1" >
          <div className='d-flex justify-content-center'>
            <img src="assets/img/brand/Logos/PNG/Alternate/Alternate.png" className="img-fluid" alt="" style={{ width: "50%" }} />
          </div>
          <div className="d-flex justify-content-center mb-5">
            <h1 className='text-center registration' >Ready to Play? Register Your Tot Today!</h1>
          </div>
          <div className="row ">
            <div className="col-12 col-md-12 register-text d-flex justify-content-center">
            
            <div>
              <p>Joining the Later Tots fun is as easy as drop, play, and stay!</p>
              <ul>
                <li>Quick & Simple Online Registration – It only takes a few minutes!</li>
                <li>Reserve Your Tot’s Spot – You can book playtime in advance once registered.</li>
                <li>First-Time Fun Tour – We’ll show you around so you and your tot feel right at home!</li>
                <li>Cubbies for Tots – Each tot gets a special spot to store their belongings.</li>
                <li>Safe & Secure – Parents upload a tot photo, and ID checks are required at pick-up.</li>
                <li>Pay at Pick-Up – Payment is collected when you come to grab your happy, played-out tot!</li>
                <li>4-Hour Play Limit – To keep the fun fair for everyone, tots can enjoy up to 4 hours of play per day.</li>
              </ul>
              <p>Let’s get ready to giggle, explore, and create lasting memories! </p>
              <h5 className='text-center'>Registration coming soon</h5>
              </div>
            </div>
            <div className="col-12 col-md-6 d-none">
              <h3 className='text-center' style={{ color: '#e51377', fontSize: '40px' }}>Register</h3>
              <UserForm />
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-center">
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-center">
        </div>
      </div>
    </div>

  );
}

export default UserRegistrationPage;