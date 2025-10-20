import React from 'react';

function EventPage() {
    return (
        <>
            <div className="bg-white" style={{ background: 'url("assets/img/events/eventsbg.png") repeat', backgroundSize: 'contain', width: '100%', }}>

                <div className="container-fluid">
                    <div className="row ">
                        <div className="col-lg-12 d-flex justify-content-center">
                            <img src="./assets/img/events/eventsheader.png" className='img-fluid' alt='colorful hands' />
                        </div>

                    </div>
                </div>


            </div><div>
                <section id="about" className="container">
                    {/* <div class="section-title events-title" dataAos="fade-up">
                    <h2>Special Days, Big Fun!</h2>
                    <p style={{ color: '#3B38DA' }}>Exciting Events at Later Tots</p>
                </div> */}

                    <div className="row content">
                        <div className="col">
                            <div className="event-highlights">
                                <h5>Event Highlights</h5>
                            </div>
                        </div>
                    </div>
                    <div className="row content">

                        <div className="col-md-8" dataAos="fade-up">
                            <div class="pink">
                                <h3>Tots Night In </h3>
                                <p>Tot & Me is the perfect class for caregivers and little ones to explore Later Tots side by side before jumping into drop-in play. Each session is filled with songs, crafts, bubbles, and themed adventures that spark creativity and connection.
                                </p>
                            </div>
                            <div class="blue">
                                <h3 className="mt-5">Tot & Me</h3>
                                <p>Tots Night In gives caregivers a well-deserved break while little ones enjoy Later Tots after hours. With games, crafts, music, and movies, it's a night full of giggles, wiggles, and wonder.</p>
                            </div>
                            <div class="purple">
                                <h3 className="mt-5">Funshops</h3>
                                <p>Celebrate the seasons with our Seasonal & Holiday Funshops
                                    These special events are all about tots and their loved ones making memories through crafts, play, and fun.</p>
                                <ul>
                                    <li>Valentine's Day: Make sweet cards, treats, and enjoy love-filled activities.</li>
                                    <li>Mother's & Father's Day: Create keepsakes, personalized gifts, and celebrate your exceptional caregivers.</li>
                                    <li>Summer Fun: Kick off summer with beach crafts, water play, and sunny adventures.</li>
                                    <li>Holiday Season: Get festive with DIY ornaments, holiday crafts, and cheerful activities for the whole family.</li>
                                </ul>
                            </div>

                        </div>
                    </div>
                    <div className="row content">
                        <div className="col-md-12" dataAos="fade-up">
                            <iframe src="https://calendar.google.com/calendar/embed?height=500&wkst=1&ctz=UTC&bgcolor=%23C0CA33&title=Later%20Tots&src=aW5mb0BsYXRlcnRvdHNkcm9waW4uY29t&src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%23039BE5&color=%23B39DDB" style={{ border: "solid 1px #777" }} width="100%" height="700" frameborder="0" scrolling="no"></iframe>

                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default EventPage;