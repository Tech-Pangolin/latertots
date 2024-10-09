import React from 'react';

function EventPage() {
    return (
        <div className="bg-white">
            <section id="hero" style={{ background: "black", padding: 0 }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            <img src="./assets/img/events/colorhands.jpg" className='img-fluid' alt='colorful hands' />
                        </div>

                    </div>
                </div>



            </section>
            <section id="about" className="about container">
                <div class="section-title events-title" dataAos="fade-up">
                    <h2>Special Days, Big Fun!</h2>
                    <p style={{ color: '#3B38DA' }}>Exciting Events at Later Tots</p>
                </div>

        <div className="row content">
            <div className="col">
            <p>From themed play dates, Tots night in, to birthday bashes, Later Tots is the place to be for all things fun and festive! Check out our upcoming events to see how we’re celebrating each day with creativity, joy, and lots of laughter. Make sure to mark your calendar so your little one doesn't miss out on the fun!</p>
            </div>
            </div>
                <div className="row content">
                    <div className="col-md-4" dataAos="fade-right">
                        {/* <img src="assets/img/events/smileyhair.jpg" className="img-fluid" alt="" /> */}
                        <img src="assets/img/momskids.png" className="img-fluid page-img" alt="" />
                        {/* <img src="assets/img/kids3.jpg" className="img-fluid mt-5" alt="" /> */}
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                      
                        <h3>Tots Night In </h3>
                        <p>We know how important it is for our Tot-tenders to enjoy a tot-free evening, and we’ve got you covered with our Tots Night In package! While you unwind, your little ones will be having a blast with a fun-filled night of music, games, crafts, and movies. We also provide a fun dinner, so you can relax knowing that your tots are in good hands, enjoying every moment. It’s the perfect way to treat yourself to a carefree evening while we take great care of your special little ones. Price:$75 for the first tot additional $10 per tot  (7:00 PM – 11:00 PM)
                        </p>

                        <h3>Tot & Me</h3>
                        <p>Tot & Me is the perfect introduction to Later Tots for caregivers who want to ease into the experience with their little ones by their side. This class is designed for Tot-minders who aren’t quite ready for a drop-off yet, offering a fun and engaging way to get comfortable with our space and services. Each class features a different theme, creating a new adventure every time! Together, we’ll dive into stories, blow bubbles, sing songs, and explore creative activities that encourage key developmental skills. Whether it’s exploring colors, counting, or simple crafts, Tot & Me is all about bonding, learning, and having fun in a supportive environment. </p>
                        <p>Join us for an exciting way to connect with your tot while getting familiar with everything Later Tots has to offer!</p>
                    </div>
                </div>
                <section id="pricing" class="pricing">
                    <div class="container">

                        <div class="section-title" dataAos="fade-up">
                            <h2>Tot-tastic Parties</h2>
                            <p>Party Packages</p>
                        </div>

                        <div class="row" dataAos="fade-left">

                            <div class="col-lg-4 col-md-12 mt-3">
                                <div class="box" dataAos="zoom-in" dataAosDelay="100">
                                    <h3>Express Tot Party <br />(1 hour 30 minutes)</h3>
                                    <h4><sup>$</sup>200 <br /><span>(weekday discount: $170)</span></h4>
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
                                    <h3>Tot's Celebration Bash <br />(2 hours)</h3>
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
                                    <h3>Tot's Ultimate Party <br />(2 hours 30 minutes)</h3>
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


        </div>
    );
}

export default EventPage;