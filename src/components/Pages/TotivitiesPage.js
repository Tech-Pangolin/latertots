import React from 'react';

function AboutPage() {
    return (
        <div className='bg-white' >
            <section id="totTivities" className="totTivities" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-7">
                            {/* <div className="w-100 d-flex justify-content-center"><img src="assets/img/totivities/orangesquiggle.png" class="img-fluid" style={{ width: '30%' }} /></div> */}
                            <div className="w-100 squiggle" style={{}}>
                            <h1 className="text-center mr-5">TOT-TIVITIES</h1></div>
                            <div className="w-100 d-flex justify-content-center cloud"><img src="assets/img/totivities/discovercloud.png" class="img-fluid" /></div>
                        </div>
                        <div className="col d-flex justify-content-end photo"><img src="assets/img/totivities/kidscircle.png" class="img-fluid" style={{}} /></div>
                    </div>
                </div>


            </section>
            <section className="totivities-container wavy container">
                <div className="row">
                    <div className="col-12 col-sm-7">
                        <div className="row">
                            <div className="col-md-2">
                                <img src="assets/img/totivities/abc.png" className="img-fluid mb-5" alt="" />
                            </div>
                            <div className="col-md-8">
                                <div class="mb-5">
                                    <h3>Tiny Tot Explorers</h3>
                                    <h4>(For 2-3-Year-Olds)</h4>
                                    <p>Watch your little one dive into a world of fun and discovery in our tiny tot class! Designed for curious toddlers ready to socialize and explore, this class helps little adventurers build communication skills, practice routines, and gain confidence—all through play! With engaging circle time, hands-on activities, and plenty of giggles, every session is a new adventure. Join us Tuesdays and Thursdays from 10 AM to 2 PM and let the exploring begin! Price: $25 per/hr class per child (4-hour session)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-2">
                                <img src="assets/img/totivities/pencil.png" className="img-fluid mb-5" alt="" />
                            </div>
                            <div className="col-md-8">
                                <div class="mb-5">
                                    <h3>Ready, Set, Pre-K!</h3>
                                    <h4>(For 4-5-Year-Olds)</h4>
                                    <p>Get ready for a playful leap into learning with Ready, Set, Pre-K! This exciting class is all about fun, exploration, and getting tots excited for the next big step—kindergarten! Through hands-on activities, interactive games, and creative play, little learners will dive into letters, numbers, and early problem-solving skills without even realizing they’re learning. From scribbling their names to counting their favorite toys, every moment is packed with discovery and joy. Join us Mondays and Wednesdays from 10 AM to 2 PM for a fun-filled adventure that builds confidence, curiosity, and a love for learning! Price: $25 per/hr per child (4-hour session)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-2">
                                <img src="assets/img/totivities/book.png" className="img-fluid" alt="" />
                            </div>
                            <div className="col-md-8">
                                <div class="mb-5">
                                    <h3>Tot-ally Fun Saturdays</h3>
                                    <p>Kickstart your weekend with Tot-astic Saturday! It’s the ultimate playdate, packed with creativity, movement, and laughter! Your tot will jump into a morning of hands-on crafts, music, and playful learning—all while making new friends and exploring exciting activities. Each session is a new adventure, so no two Saturdays are the same! Since we sometimes host special events and private parties, be sure to check the schedule and grab your tot’s spot early. Let’s make Saturdays tot-ally awesome!
                                        Price: $25/hr per child (3-hour session)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                   
                        <div className="col d-flex align-items-end justify-content-end">
                            <img src="assets/img/totivities/kidsstars.png" className="img-fluid mb-5" />
                        </div>
                    </div>
            </section>


        </div>
    );
}

export default AboutPage;