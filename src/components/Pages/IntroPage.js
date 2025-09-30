import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function IntroPage() {
    const [status, setStatus] = useState("");
    const handleSubmit = async (event) => {
        
        event.preventDefault();
        const formData = new FormData(event.target);

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };
        fetch("https://sendcontactemail-eupp2jkaaq-uc.a.run.app/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error));
    };

    return (
        <>
            {/* HERO SECTION */}
            <section id="hero">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12 ">


                            <div style={{ width: '100%' }} className='d-flex justify-content-center'><img src="./assets/img/hero/welcome.png" className="img-fluid" /></div>
                        </div>
                    </div>
                    <div className="container">
                        <div className="row d-flex justify-content-between mt-2">
                            <div className="col-12 col-md-8 d-flex justify-content-center"> <img src="assets/img/hero/photoline.png" className="img-fluid" style={{ height: "84%" }} alt="" /></div>
                            <div className="col-12 col-md-4 d-flex justify-content-end align-items-end"> <img src="assets/img/hero/logo-cir.png" id="hero-logo" className="img-fluid slide-in d-none d-sm-block" style={{ width: "300px", height: "300px" }} alt="" /></div>
                            <div className="col-12 d-block d-sm-none d-flex justify-content-center"><img src="assets/img/hero/logo-cir.png" className="img-fluid text-center" style={{ width: '50%' }} /></div>

                        </div>
                    </div>
                </div>

                <svg className="hero-waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28 " preserveAspectRatio="none">
                    <defs>
                        <path id="wave-path" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                    </defs>
                    <g className="wave1">
                        <use xlinkHref="#wave-path" x="50" y="3" fill="rgba(255,255,255, .1)" />
                    </g>
                    <g className="wave2">
                        <use xlinkHref="#wave-path" x="50" y="0" fill="rgba(255,255,255, .2)" />
                    </g>
                    <g className="wave3">
                        <use xlinkHref="#wave-path" x="50" y="9" fill="#41A8C5" />
                    </g>
                </svg>

            </section>
            {/* END HERO SECTION */}
            <main>
                <section id="about" className="about" style={{ backgroundColor: '#41A8C5' }}>
                    <div className="container">
                        <div className="row content">
                            <div className="col-md-4 order-1 order-md-2">
                                <img src="assets/img/bluehand.png" className="img-fluid" alt="" style={{ borderRadius: '50%', }} />
                                <br />

                            </div>
                            <div className="col-xl-7 col-lg-6 icon-boxes d-flex flex-column align-items-stretch px-lg-5">
                                <h2 style={{ color: '#FFF' }}>What is Later Tots?</h2>
                                <p>
                                    At Later Tots, every day is a play day! Our indoor play space is designed for tots 18 months to 6 years to drop in and enjoy non-stop fun. From exploring new adventures to creative play and making new friends, every visit is packed with high energy, imagination, and laughter.
                                </p>
                                <p>
                                    We make playtime easy—no schedules, no stress—just a safe and engaging space where tots can move, imagine, and play to their heart's content. And while they're off on their next great adventure, you can enjoy peace of mind knowing your tots are safe, engaged, and having the time of their lives!
                                </p>
                                <p>
                                    At Later Tots, we truly believe that every child deserves a place where they feel at home, even when they're away. That's why we're proud to be your tot's happy place away—where they can drop, play, and stay.

                                </p>


                            </div>
                        </div>
                        <div className="row d-flex justify-content-center">
                            <img src="assets/img/homekids.png" className="img-fluid main-kids" />
                        </div>
                        <div className="row d-flex justify-content-center mt-5">
                            <div className='col text-center'><a className='signup-btn' href="/login">Sign Up Now</a></div>

                        </div>

                    </div>
                </section>
                <section id="contact" className="contact">
                    <div className="container px-lg-5">

                        <div className="section-title">
                            <p>Contact Us</p>
                        </div>

                        <div className="row">

                            <div className="col-lg-4">
                                <div className="info">
                                    <div className="address">
                                        <i className="bi bi-geo-alt"></i>
                                        <h4>Location:</h4>
                                        <p>10007 Weddington Road</p>
                                        <p>Concord, North Carolina 28027</p>
                                    </div>

                                    <div className="email">
                                        <i className="bi bi-envelope"></i>
                                        <h4>Email:</h4>
                                        <p>info@latertotsdropin.com</p>
                                    </div>

                                    <div className="phone">
                                        <i className="bi bi-phone"></i>
                                        <h4>Hours:</h4>
                                        <p>9am - 6pm</p>
                                    </div>

                                </div>

                            </div>

                            <div className="col-lg-8 my-5 mt-lg-0">

                                <form onSubmit={handleSubmit} method="post" role="form" className="php-email-form">
                                    <div className="row">
                                        <div className="col-md-6 form-group">
                                            <input type="text" name="name" className="form-control" id="name" placeholder="Your Name" required />
                                        </div>
                                        <div className="col-md-6 form-group mt-3 mt-md-0">
                                            <input type="email" className="form-control" name="email" id="email" placeholder="Your Email" required />
                                        </div>
                                    </div>
                                    <div className="form-group mt-3">
                                        <input type="text" className="form-control" name="subject" id="subject" placeholder="Subject" required />
                                    </div>
                                    <div className="form-group mt-3">
                                        <textarea className="form-control" name="message" rows="5" placeholder="Message" required></textarea>
                                    </div>
                                    <div className="my-3">
                                        <div className="loading">Loading</div>
                                        <div className="error-message"></div>
                                        <div className="sent-message">Your message has been sent. Thank you!</div>
                                    </div>
                                    <div className="text-center"><button type="submit">Send Message</button></div>
                                </form>

                            </div>

                        </div>

                    </div>
                </section>
            </main>
        </>
    );
}

export default IntroPage;