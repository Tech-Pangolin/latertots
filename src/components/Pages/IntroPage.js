import React, { useEffect } from 'react';

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

  <section id="hero">
    <div className="container">
      <div className="row justify-content-between">
        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
          <div dataAos="zoom-out">
            <h1>Welcome to LaterTots</h1>
            {/* <h2>We are team of talented designers making websites with Bootstrap</h2> */}
            <div className="text-center text-lg-start">
              <a href="#about" className="btn-get-started scrollto">Get Started</a>
            </div>
          </div>
        </div>
        <div className="col-lg-4 order-1 order-lg-2 hero-img" dataAos="zoom-out" dataAosDelay="300">
          <img src="./assets/img/logo.png" className="img-fluid animated" alt=""/>
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


  </>
  );
}

export default IntroPage;