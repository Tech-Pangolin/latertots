import React from 'react';

function DealsPage() {
    return (
        <>
            <section id="deals" className="deals" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            {/* <img src="./assets/img/crayons.png" className='img-fluid' alt='colorful hands' /> */}

                        </div>

                    </div>
                </div>


            </section>
            <section id="about" className="about mx-5">
                <div className="container">
                    <div className="section-title" dataAos="fade-up">
                        <h2>Tot Deals</h2>
                        <p sx={{ color: '#3B38DA' }}>Affordable Fun for Everyone</p>
                    </div>

                    <div className="row content">
                        <p>You can explore our flexible pricing options designed to fit your schedule. Whether it’s a quick drop-in or a longer stay, we’ve got you covered at just $20 per hour per child, $7 extra per child, snacks included! Be sure to check out our different ways to save for even more value.</p>
                    </div>

                    <div className="row content">
                        <div className="col-md-2 order-1 order-md-1 mt-5" dataAos="fade-left">
                            <img src="assets/img/deals/happygirl.png" className="img-fluid page-img" style={{ width: '200px' }} alt="" />
                        </div>
                        <div className="col-md-4 pt-5 order-2 order-md-2" dataAos="fade-up">

                            <h3><i className="bi bi-1-square"></i> Frequent Tots Package</h3>
                            <p>
                                Pricing Options
                            </p>
                            {/* <ul style={{listStyle:'none'}}> */}
                            <p> <i className="bi bi-asterisk"></i> Silver Plan: $350  for 20 hours (Average $17.50/hour)<br />
                                <i className="bi bi-asterisk"></i> Gold Plan: $650 for 40 hours (Average $16.25/hour).</p>

                            {/* </ul> */}
                            <p>Hours valid for 3 months from purchase, allowing flexibility in usage.<br />
                                <strong>* Bonus: </strong>A choice between a Later Tots shirt or tote bag as a thank-you for your commitment.
                            </p>

                        </div>
                        <div className="col-md-4 pt-5 order-2 order-md-2" dataAos="fade-up">
                            <h3><i className="bi bi-2-square"></i> Refer-a-Friend Discount</h3>
                            <p>
                                Discount:  Refer a friend who signs up for a package, and both families get 2 free hours
                            </p>
                           
                        </div>
                        <div className='col order-3 order-md-3 mt-5'>
                           
 <img src="assets/img/deals/happykids.png" className='img-fluid page-img'/>
                        </div>
                    </div>
                    {/* <div className="row content">
                        <div className="col-md-4 order-1 order-md-2 mt-5" dataAos="fade-left">
                            <img src="assets/img/about/diaperchange.jpg" className="img-fluid" alt="" />
                        </div>
                        <div className="col-md-8 pt-5 order-2 order-md-1" dataAos="fade-up">
                            <h3><i className="bi bi-2-square"></i> Refer-a-Friend Discount</h3>
                            <p>
                             Discount:  Refer a friend who signs up for a package, and both families get 2 free hours
                            </p>
                           
                        </div>
                    </div> */}
                    <div className="row content">
                        <div className="col-md-4 order-1 order-md-1 mt-5 d-flex justify-content-end" dataAos="fade-left">
                            <img src="assets/img/deals/popcorn.png" className="img-fluid page-img" style={{ width: '243px' }} alt="" />
                        </div>
                        <div className="col-md-8 pt-5 order-2 order-md-2" dataAos="fade-up">
                            <h3><i className="bi bi-3-square"></i> Tot-tastic Savings for Classes</h3>
                            <p>
                                Tot Adventures & Ready, Set, Pre-K!
                            </p>
                            <ul style={{ listStyle: 'none' }}>
                                <li><i className="bi bi-asterisk"></i> Discount: Book a full month with a reduced rate of $22 per hour (8 sessions = 1 month)</li>
                            </ul>

                            <p>
                                Tot-ally Fun Saturdays
                            </p>
                            <ul style={{ listStyle: 'none' }}>
                                <li><i className="bi bi-asterisk"></i> Discount:  Receive a 10% discount when booking for the entire month.</li>
                            </ul>
                            <p>
                                * Bonus: A choice between a Later Tots shirt or tote bag as a thank-you for you commitment.
                            </p>
                        </div>
                    </div>
                </div>
            </section>


        </>
    );
}

export default DealsPage;