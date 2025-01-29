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

            <section id="about" className="about careers">
                <div className="container-fluid">
                    <div className="section-title" dataAos="fade-up">                       
                        <p sx={{ color: '#3B38DA' }} className="text-center">Join Our Tot-tastic Team at Later Tots!</p>
                    </div>
                    <div className="row">

                        <div className="col-xl-12 col-lg-12 icon-boxes d-flex flex-column align-items-stretch justify-content-center px-lg-5" dataAos="fade-left">
                            {/* <h3>Enim quis est voluptatibus aliquid consequatur fugiat</h3> */}
                            <p>Are you passionate about creating a playful and nurturing environment for little ones? At Later Tots, we're on a mission to make every moment a magical experience for tots and their families. We're always looking for dedicated, enthusiastic individuals to join our Tot-tender team. Whether you're a seasoned childcare professional or just beginning your journey in early childhood development, you'll find a rewarding and supportive atmosphere here.

                                Our staff is the heart of what we do, and we believe in fostering a collaborative, fun, and safe space for both our tots and team members. From crafting imaginative play sessions to guiding tots through their daily adventures, every day brings a new opportunity to make a positive impact.
                            </p>

                            <div className="icon-box" dataAos="zoom-in" dataAosDelay="100">
                                <div className="icon"><i className="bx bx-meteor"></i></div>
                                <h4 className="title">Why Later Tots?</h4>

                                <p className="description">  <ul><li>Competitive pay and benefits
                                </li>
                                    <li>Ongoing training and career development</li>
                                    <li>A fun, supportive environment that values creativity and teamwork
                                    </li>
                                    <li>Flexible scheduling options
                                    </li>
                                    <li>Opportunities to work in a variety of roles, from Tot-tenders to event coordinators</li>
                                </ul></p>
                            </div>

                            <div className="icon-box" dataAos="zoom-in" dataAosDelay="200">
                                <div className="icon"><i className="bx bx-briefcase"></i></div>
                                <h4 className="title">Qualifications</h4>
                                <p className="description">
                                    <ul>
                                        <li>A love for working with children</li>
                                        <li>CPR and First Aid certification (or willingness to obtain)</li>
                                        <li>Background check clearance
                                        </li>
                                        <li>A positive, team-oriented attitude
                                        </li>
                                    </ul>
                                </p>
                            </div>
                            <h4 className="title mt-5" style={{ fontSize: '18px', fontWeight: '700' }}>Ready to join the fun?</h4>
                            <p>
                                Apply today and become part of the Later Tots family, where play is always in progress, and every tot’s smile is a win!
                            </p>
                        </div>

                    </div>

                </div>
            </section>



        </div>
    );
}

export default CareersPage;