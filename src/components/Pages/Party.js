import React from 'react';

function PartyPage() {
    return (
        <div className='bg-color'>
            <section id="totTivities" className="totTivities" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            {/* <img src="./assets/img/crayons.png" className='img-fluid' alt='colorful hands' /> */}

                        </div>

                    </div>
                </div>


            </section>

            <section id="pricing" class="pricing">
                <div class="container">

                    <div class="section-title d-flex justify-content-center" dataAos="fade-up">
                        <p id="party-packages" className="text-center">Party Packages</p>
                    </div>

                    <div class="row" dataAos="fade-left">

                        <div class="col-lg-4 col-md-12 mt-3">
                            <div id="party1" class="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Express Tot Party </h3>
                                <h4><span></span></h4>
                                <ul>
                                    <li><i className="bi bi-check"></i>(1 hour 30 minutes)</li>
                                    <li><i className="bi bi-check"></i><sup>$</sup>200 <br /></li>                                    
                                    <li><i className="bi bi-check"></i>(weekday discount: $170)</li>
                                    <li><i className="bi bi-check"></i> Basic decorations</li>
                                    <li><i className="bi bi-check"></i> Simple theme selection</li>
                                    <li><i className="bi bi-check"></i> Fun & fast-paced</li>
                                </ul>
                                <div class="btn-wrap">
                                    <a href="/profile" class="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-12 mt-3">
                            <div id="party2" class="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Tot's Celebration Bash</h3>
                                <h4></h4>
                                <ul>
                                    <li><i className="bi bi-check"></i>(2 hours)</li>
                                    <li><i className="bi bi-check"></i><sup>$</sup>280</li>
                                    <li><i className="bi bi-check"></i> Enhanced decorations</li>
                                    <li><i className="bi bi-check"></i> Multiple themes to choose from</li>
                                    <li><i className="bi bi-check"></i> Two activities and games
                                    </li>
                                </ul>
                                <div class="btn-wrap">
                                    <a href="/profile" class="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-12 mt-3">
                            <div id="party3" class="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Tot's Ultimate Party</h3>
                                <ul>
                                    <li><i className="bi bi-check"></i>(2 hours 30 minutes)</li>
                                    <li><i className="bi bi-check"></i> <sup>$</sup>350</li>
                                    <li><i className="bi bi-check"></i> Themed decorations</li>
                                    <li><i className="bi bi-check"></i> Fun tot-friendly music</li>
                                    <li><i className="bi bi-check"></i> Custom gift for the birthday tot</li>
                                    <li><i className="bi bi-check"></i> Party favors for each child</li>
                                </ul>
                                <div class="btn-wrap">
                                    <a href="/profile" class="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>




                    </div>

                </div>
            </section>
            <section className="container">
                <div class="section-title d-flex justify-content-center" dataAos="fade-up">
                    <p id="upcoming-events">Our Upcoming Events</p>
                </div>
               <iframe src="https://calendar.google.com/calendar/embed?src=c_1c1732ecaaf7f410a35bd17215c56ce7c88961913f9fba714a0684c82d41aa59%40group.calendar.google.com&ctz=UTC" style={{ border: 0 }} width="800" height="600" frameBorder="0" scrolling="no"></iframe>
               
            </section>


        </div>
    );
}

export default PartyPage;