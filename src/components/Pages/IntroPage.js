import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function IntroPage() {
    //   const [users, setUsers] = React.useState([]);
    //   useEffect(() => {
    //     fetchAllUsers().then((resp) => {
    //       setUsers(resp);
    //     });
    //   }, []);

    return (
        <>
            {/* <header id="header" className="fixed-top d-flex align-items-center header-transparent">
    <div className="container d-flex align-items-center justify-content-between">

      <div className="logo">
        <h1><a href="index.html"><span>Bootslander</span></a></h1>
        <a href="index.html"><img src="assets/img/logo.png" alt="" className="img-fluid"></a>
      </div>

      <nav id="navbar" className="navbar">
        <ul>
          <li><a className="nav-link scrollto active" href="#hero">Home</a></li>
          <li><a className="nav-link scrollto" href="#about">About</a></li>
          <li><a className="nav-link scrollto" href="#features">Features</a></li>
          <li><a className="nav-link scrollto" href="#gallery">Gallery</a></li>
          <li><a className="nav-link scrollto" href="#team">Team</a></li>
          <li><a className="nav-link scrollto" href="#pricing">Pricing</a></li>
          <li className="dropdown"><a href="#"><span>Drop Down</span> <i className="bi bi-chevron-down"></i></a>
            <ul>
              <li><a href="#">Drop Down 1</a></li>
              <li className="dropdown"><a href="#"><span>Deep Drop Down</span> <i className="bi bi-chevron-right"></i></a>
                <ul>
                  <li><a href="#">Deep Drop Down 1</a></li>
                  <li><a href="#">Deep Drop Down 2</a></li>
                  <li><a href="#">Deep Drop Down 3</a></li>
                  <li><a href="#">Deep Drop Down 4</a></li>
                  <li><a href="#">Deep Drop Down 5</a></li>
                </ul>
              </li>
              <li><a href="#">Drop Down 2</a></li>
              <li><a href="#">Drop Down 3</a></li>
              <li><a href="#">Drop Down 4</a></li>
            </ul>
          </li>
          <li><a className="nav-link scrollto" href="#contact">Contact</a></li>
        </ul>
        <i className="bi bi-list mobile-nav-toggle"></i>
      </nav>

    </div>
  </header> */}
            {/* HERO SECTION */}
            <section id="hero">
                <div className="container-fluid">
                    <div className="row justify-content-between">
                        <div className="col-sm-12 col-lg-7 pt-5 pt-lg-0 order-1 order-lg-2 order-sm-2 d-flex align-items-center d-none d-sm-block">
                            <div dataAos="zoom-out">
                                
                                <h1 >Welcome to LaterTots</h1>
                                <h2>Where every child finds their happy place away.<br /> Discover a world of flexible, fun, and secure child care that fits your busy life.</h2>
                                <div className="text-center text-lg-start mb-5">
                                    <a href="/register" className="btn-get-started scrollto">Get Started</a>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-12 col-lg-4 order-2 order-lg-1 order-sm-1 hero-img" dataAos="zoom-out" dataAosDelay="300">
                            <img src="./assets/img/brand/Logos/png/primaryLogos/primaryWhite.png" className="img-fluid animated slide-in" style={{width:"75%"}}  alt="" />
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
                        <use xlinkHref="#wave-path" x="50" y="9" fill="#fff" />
                    </g>
                </svg>

            </section>
            {/* END HERO SECTION */}
            <main>
                <section id="about" className="about">
                    <div className="container">
                        <div class="row content">
                            <div class="col-md-4 order-1 order-md-2" dataAos="fade-left">
                                <img src="assets/img/bluehand.png" class="img-fluid" alt="" style={{borderRadius:'50%'}} />
                            </div>
                            <div className="col-xl-7 col-lg-6 icon-boxes d-flex flex-column align-items-stretch px-lg-5" dataAos="fade-left">
                                <h2 style={{ color: '#41A8C5' }}>What is Later Tots?</h2>
                                <p>
                                    Later Tots is more than just a drop-in child care service—it's a passion project born from the desire to support Tot-Tenders who need a few hours to themselves, whether for running errands, enjoying some leisure time, or simply taking a well-deserved break. We know how challenging it can be to find trustworthy, flexible child care that fits your schedule, especially when you don't need full or part-time care. That's where Later Tots comes in.
                                </p>
                                <p>
                                    Our drop-in/short-term child care program is designed for children aged 2 months to 6 years, offering a safe, fun, and secure environment where they can thrive. We’re all about creating a space where kids can play, learn, and stay happy while their caregivers enjoy peace of mind. Our flexible scheduling allows you to drop in whenever you need to, making us your go-to option for those rare or random times when childcare is hard to find.

                                </p>
                                <p>
                                    At Later Tots, we truly believe that every child deserves a place where they feel at home, even when they're away. That’s why we’re proud to be your tot’s happy place away—where they can drop, play, and stay.

                                </p>
                            </div>
                        </div>
                        
                    </div>
                </section>
                <section id="contact" class="contact">
                    <div class="container px-lg-5">

                        <div class="section-title" dataAos="fade-up">
                            <p>Contact Us</p>
                        </div>

                        <div class="row">

                            <div class="col-lg-4" dataAos="fade-right" dataAos-delay="100">
                                <div class="info">
                                    <div class="address">
                                        <i class="bi bi-geo-alt"></i>
                                        <h4>Location:</h4>
                                        <p>Concord, North Carolina</p>
                                    </div>

                                    <div class="email">
                                        <i class="bi bi-envelope"></i>
                                        <h4>Email:</h4>
                                        <p>info@latertotsdropin.com</p>
                                    </div>

                                    <div class="phone">
                                        <i class="bi bi-phone"></i>
                                        <h4>Hours:</h4>
                                        <p>8:30am - 5:30pm</p>
                                    </div>

                                </div>

                            </div>

                            <div class="col-lg-8 mt-5 mt-lg-0" dataAos="fade-left" dataAosDelay="200">

                                <form action="forms/contact.php" method="post" role="form" class="php-email-form">
                                    <div class="row">
                                        <div class="col-md-6 form-group">
                                            <input type="text" name="name" class="form-control" id="name" placeholder="Your Name" required />
                                        </div>
                                        <div class="col-md-6 form-group mt-3 mt-md-0">
                                            <input type="email" class="form-control" name="email" id="email" placeholder="Your Email" required />
                                        </div>
                                    </div>
                                    <div class="form-group mt-3">
                                        <input type="text" class="form-control" name="subject" id="subject" placeholder="Subject" required />
                                    </div>
                                    <div class="form-group mt-3">
                                        <textarea class="form-control" name="message" rows="5" placeholder="Message" required></textarea>
                                    </div>
                                    <div class="my-3">
                                        <div class="loading">Loading</div>
                                        <div class="error-message"></div>
                                        <div class="sent-message">Your message has been sent. Thank you!</div>
                                    </div>
                                    <div class="text-center"><button type="submit">Send Message</button></div>
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