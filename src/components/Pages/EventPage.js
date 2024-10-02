import React from 'react';

function EventPage() {
    return (
        <>
            <section id="hero" style={{ background: "black", padding: 0 }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            <img src="./assets/img/events/colorhands.jpg" className='img-fluid' alt='colorful hands' />
                            {/* <div dataAos="zoom-out">
                            <h1>Welcome to LaterTots</h1>
                            <h2>We are team of talented designers making websites with Bootstrap</h2>
                            <div className="text-center text-lg-start">
                                <a href="/register" className="btn-get-started scrollto">Get Started</a>
                            </div>
                        </div> */}
                        </div>
                        {/* <div className="col-lg-4 order-1 order-lg-2 hero-img" dataAos="zoom-out" dataAosDelay="300">
                        <img src="./assets/img/logo.png" className="img-fluid animated" alt="" />
                    </div> */}
                    </div>
                </div>

                {/* <svg className="hero-waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28 " preserveAspectRatio="none">
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
            </svg> */}

            </section>
            <section id="about" className="about container">
                <div class="section-title" dataAos="fade-up">
                    <h2>Special Days, Big Fun!</h2>
                    <p sx={{ color: '#3B38DA' }}>Exciting Events at Later Tots</p>
                </div>


                <div className="row content">
                    <div className="col-md-4" dataAos="fade-right">
                        {/* <img src="assets/img/events/smileyhair.jpg" className="img-fluid" alt="" /> */}
                        <img src="assets/img/littleboyballpit.png" className="img-fluid" alt="" />
                        {/* <img src="assets/img/kids3.jpg" className="img-fluid mt-5" alt="" /> */}
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                        <p>From themed play dates, Tots night in, to birthday bashes, Later Tots is the place to be for all things fun and festive! Check out our upcoming events to see how we’re celebrating each day with creativity, joy, and lots of laughter. Make sure to mark your calendar so your little one doesn't miss out on the fun!</p>
                        <h3>Tots Night In </h3>
                        <p>We know how important it is for our Tot-tenders to enjoy a tot-free evening, and we’ve got you covered with our Tots Night In package! While you unwind, your little ones will be having a blast with a fun-filled night of music, games, crafts, and movies. We also provide a fun dinner, so you can relax knowing that your tots are in good hands, enjoying every moment. It’s the perfect way to treat yourself to a carefree evening while we take great care of your special little ones. Price:$75 for the first tot additional $10 per tot  (7:00 PM – 11:00 PM)
                        </p>
                       
                        {/* <p>
                            Qui consequatur temporibus. Enim et corporis sit sunt harum praesentium suscipit ut voluptatem. Et nihil magni debitis consequatur est.
                        </p>
                        <p>
                            Suscipit enim et. Ut optio esse quidem quam reiciendis esse odit excepturi. Vel dolores rerum soluta explicabo vel fugiat eum non.
                        </p> */}
                    </div>
                </div>
                <section id="pricing" class="pricing">
      <div class="container">

        <div class="section-title" dataAos="fade-up">
          <h2>Tot-tastic Celebrations</h2>
          <p>Party Packages</p>
        </div>

        <div class="row" dataAos="fade-left">

          <div class="col-lg-4 col-md-12 mt-3">
            <div class="box" dataAos="zoom-in" dataAosDelay="100">
              <h3>Express Tot Party <br/>(1 hour 30 minutes)</h3>
              <h4><sup>$</sup>200 <br/><span>(weekday discount: $170)</span></h4>
              <ul>
                            <li><i className="bi bi-check"></i> Basic decorations</li>
                            <li><i className="bi bi-check"></i> Simple theme selection</li>
                            <li><i className="bi bi-check"></i> Fun & fast-paced</li>
              </ul>
              <div class="btn-wrap">
                <a href="#" class="btn-buy">Sign Up Now</a>
              </div>
            </div>
          </div>
          <div class="col-lg-4 col-md-12 mt-3">
            <div class="box" dataAos="zoom-in" dataAosDelay="100">
              <h3>Tot's Celebration Bash <br/>(2 hours)</h3>
              <h4><sup>$</sup>280</h4>
              <ul>
              <li><i className="bi bi-check"></i> Enhanced decorations</li>
                            <li><i className="bi bi-check"></i> Multiple themes to choose from</li>
                            <li><i className="bi bi-check"></i> Two activities and games
                            </li>
              </ul>
              <div class="btn-wrap">
                <a href="#" class="btn-buy">Sign Up Now</a>
              </div>
            </div>
          </div>
          <div class="col-lg-4 col-md-12 mt-3">
            <div class="box" dataAos="zoom-in" dataAosDelay="100">
              <h3>Tot's Ultimate Party <br/>(2 hours 30 minutes)</h3>
              <h4><sup>$</sup>350</h4>
              <ul>
              <li><i className="bi bi-check"></i> Themed decorations</li>
                            <li><i className="bi bi-check"></i> Fun tot-friendly music</li>
                            <li><i className="bi bi-check"></i> Custom gift for the birthday tot</li>
                            <li><i className="bi bi-check"></i> Party favors for each child</li>
              </ul>
              <div class="btn-wrap">
                <a href="#" class="btn-buy">Sign Up Now</a>
              </div>
            </div>
          </div>
          

         

        </div>

      </div>
    </section>

            </section>


        </>
    );
}

export default EventPage;