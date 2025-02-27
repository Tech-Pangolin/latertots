import React from 'react';
import UserForm from '../Shared/UserForm';

function UserRegistrationPage() {

  return (
    <div className="container">
      <div className="row content">
        {/* <div className="col-md-5 order-1 order-md-2" >
          <img src="assets/img/play.png" className="img-fluid mt-5 page-img" alt="" />
        </div> */}
        <div className="col order-2 order-md-1" >
          <div className='d-flex justify-content-center'>
          <img src="assets/img/brand/Logos/PNG/Alternate/Alternate.png" className="img-fluid" alt="" style={{width:"50%"}} />
          </div>
          <div className="d-flex justify-content-center mb-5">
          <h1 className='text-center registration' >"Ready to make memories? Let’s get your tot ready to drop, play, and stay!"</h1>
          </div>
          <div className="row">
            <div className="col"> <p>Register your tot today and become part of the Later Tots community! </p>
          <p>You can simply register online. It only takes a few minutes.</p>
          <p>Once you have registered online, you may book a reservation.</p>
          <p>For your first visit, we will provide a tour to familiarize you with our facility. Parents will upload photos of the tots when creating their profile on our website. ID checks will be conducted at pick-up to ensure the safety of our tots and families.
          </p>
          <p>Each tot will get a cubby to store all their belongings upon arrival</p>
          <p>Payment will be collected during pick-up time.</p>
          <p>​We ask that all total-minders be advised of the 4-hour limit per day.  </p></div>
            <div className="col">
              <h3 className='text-center'>Register</h3>
               <UserForm />
            </div>
          </div>
         

          {/*  */}

        </div>

      </div>
      <div className="row">
        <div className="col d-flex justify-content-center">
          
        </div></div>
      <div className="row">
        <div className="col d-flex justify-content-center">

         
        </div>

      </div>
    </div>

  );
}

export default UserRegistrationPage;