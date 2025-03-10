import React from 'react';

function EventPage() {
    return (
        <div className="bg-white" style={{ background: 'url("assets/img/events/eventsbg.png") repeat', backgroundSize: 'contain', width: '100%', }}>
            <section id="" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-12 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            <img src="./assets/img/events/eventsheader.png" className='img-fluid' alt='colorful hands' />
                        </div>

                    </div>
                </div>



            </section>
            <section id="about" className="about container">
                {/* <div class="section-title events-title" dataAos="fade-up">
                    <h2>Special Days, Big Fun!</h2>
                    <p style={{ color: '#3B38DA' }}>Exciting Events at Later Tots</p>
                </div> */}

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
                

            </section>


        </div>
    );
}

export default EventPage;