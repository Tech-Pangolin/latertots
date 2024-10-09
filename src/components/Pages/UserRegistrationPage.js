import React from 'react';
import UserForm from '../Shared/UserForm';

function UserRegistrationPage() {

  return (
    <div className="container">
      <div className="row content">
        <div className="col-md-5 order-1 order-md-2" >
          <img src="assets/img/play.png" className="img-fluid mt-5 page-img" alt="" />
        </div>
        <div className="col-md-7 pt-5 order-2 order-md-1" >
        <div className="section-title" dataAos="fade-up">
                        <h2>Ready to Drop, Play & Stay?</h2>
                        <p sx={{ color: '#3B38DA' }}>Sign up with us to schedule</p>
                    </div>
          <p>Register your tot today and become part of the Later Tots community! </p>
          <p>You can simply register online. It only takes a few minutes.</p>
          <p>Once you have registered online, you may book a reservation.</p>
          <p>For your first visit, we will provide a tour to familiarize you with our facility. Parents will upload photos of the tots when creating their profile on our website. ID checks will be conducted at pick-up to ensure the safety of our tots and families.
          </p>
          <p>Each tot will get a cubby to store all their belongings upon arrival</p>
          <p>Payment will be collected during pick-up time.</p>
          <p>​We ask that all total-minders be advised of the 4-hour limit per day.  </p>

          {/*  */}

        </div>
      
      </div>  
      <div className="row">
      <div className="col d-flex justify-content-center">  
      <h3>Register</h3>
      </div></div>
      <div className="row">
          <div className="col d-flex justify-content-center">  
          
            <UserForm />
          </div>

        </div>
    </div>

  );
}

export default UserRegistrationPage;