import React from 'react';

function CareersPage() {
    return (
        <div className='bg-white'>
            {/* <section id="careers" className="careers-hero" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                        </div>

                    </div>
                </div>


            </section> */}

            <section id="" className=" careers">
                <div className="container">
                    <div className='row d-flex justify-content-center'>
                        <div className='col-3'>
                            <img src="assets/img/lt-logo.png" className="img-fluid" alt="careers" />
                        </div>
                    </div>
                    <div className="section-title mt-1" dataAos="fade-up">
                        <p style={{ color: '#5E17EB' }} className="text-center">Join Our Tot-tastic Team at Later Tots!</p>
                    </div>
                    <div className="row">

                        <div className="col-xl-12 col-lg-12 icon-boxes d-flex flex-column align-items-stretch justify-content-center px-lg-5" dataAos="fade-left">
                            {/* <h3>Enim quis est voluptatibus aliquid consequatur fugiat</h3> */}
                            <p className="text-center">Join the Tot-tastic Fun! </p>
                            <p>Do you have a knack for making little ones giggle, explore, and create? At Later Tots, we're all about play, imagination, and adventure—and we need fun-loving, energetic team members to bring the magic to life! Whether you're a pro at peekaboo or a master fort builder, there's a place for you on our Tot-tender team.
                                Here, every day is a chance to spark joy, inspire creativity, and make a difference in the lives of tots and their families. If you love jumping into playful activities, crafting tot-approved fun, and being part of a supportive, exciting environment, we'd love to meet you!
                            </p>
                            <p className='text-center'>Let’s turn play into purpose—one tot-sized adventure at a time!</p>
                            <h3 className='text-center mt-3'>Why LaterTots?</h3>
                            <div className="row">
                                <div className="col-2"><img src="assets/img/brand/Logos/PNG/submarkLogos/SubmarkPink.png" className='img-fluid' /></div>
                                <div className="col-10">
                                    <p><ul>
                                        <li>Competitive pay and benefits</li>
                                        <li>Ongoing training and career development</li>
                                        <li>A fun, supportive environment that values creativity and teamwork
                                        </li>
                                        <li>Flexible scheduling options
                                        </li>
                                        <li>Opportunities to work in a variety of roles, from Tot-tenders to event coordinators</li>
                                    </ul></p>
                                </div>
                            </div>
                            <h3 className='text-center mt-3'>Qualifications</h3>
                            <div className="row mb-5">
                                <div className="col-2"><img src="assets/img/careers/tree.png" className='img-fluid' /></div>
                                <div className="col-10"> <p className="description">
                                    <ul>
                                        <li>A love for working with children</li>
                                        <li>CPR and First Aid certification (or willingness to obtain)</li>
                                        <li>Background check clearance
                                        </li>
                                        <li>A positive, team-oriented attitude
                                        </li>
                                    </ul>
                                </p></div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>



        </div>
    );
}

export default CareersPage;