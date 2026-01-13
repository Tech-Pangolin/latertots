import React from 'react';

function PartyPage() {
    return (
        <div className='bg-color'>
            
            <section id="pricing" className="pricing">
                <div className="container">

                    <div className="section-title d-flex justify-content-center" dataAos="fade-up">
                        <p id="party-packages" className="text-center">Party Packages</p>
                    </div>

                    <div className="d-flex justify-content-center" dataAos="fade-up">
                        <p id="party-description" className="text-center">
                            Make your tot's special day effortless, fun, and full of laughter! Our private party space is designed 
                            for young children to explore, play, and celebrate safely, while caregivers can relax and enjoy the moment. 
                            Each party includes guided play, light-themed decor, and access to both our back party room and front playroom. 
                            Families provide food and drinks, and we handle setup, hosting, and cleanup so the focus stays on making memories. 
                            Small, curated, and playful — that's a Later Tots birthday!
                        </p>
                    </div>

                    <div className="row" dataAos="fade-left">

                        <div className="col-lg-4 col-md-12 mt-3">
                            <div id="party1" className="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Express Tot Party </h3>
                                <ul>
                                    <li><i className="bi bi-check"></i>(1 hour 30 minutes)</li>
                                    <li><i className="bi bi-check"></i><sup>$</sup>250 <br /></li>
                                    <li><i className="bi bi-check"></i>Up to 8 children</li>
                                    <li><i className="bi bi-check"></i>Back party room + front playroom access</li>
                                    <li><i className="bi bi-check"></i>Themed decor</li>
                                    <li><i className="bi bi-check"></i>Guided play + birthday moment</li>
                                    <li><i className="bi bi-check"></i>Food & drinks provided by family</li>
                                    <li><i className="bi bi-check"></i>Setup, hosting, & cleanup</li>
                                </ul>
                                <div className="btn-wrap">
                                    <a href="/profile" className="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-12 mt-3">
                            <div id="party2" className="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Tot's Celebration Bash</h3>
                                <ul>
                                    <li><i className="bi bi-check"></i>(2 hours)</li>
                                    <li><i className="bi bi-check"></i><sup>$</sup>325</li>
                                    <li><i className="bi bi-check"></i> Up to 12 children</li>
                                    <li><i className="bi bi-check"></i> Back party room + front playroom access</li>
                                    <li><i className="bi bi-check"></i> Themed decor</li>
                                    <li><i className="bi bi-check"></i> Guided play</li>
                                    <li><i className="bi bi-check"></i> Two structured activities or games</li>
                                    <li><i className="bi bi-check"></i> Fun tot-friendly music</li>
                                    <li><i className="bi bi-check"></i> Setup, hosting, and cleanup</li>
                                    <li><i className="bi bi-check"></i> Food & drinks provided by family</li>
                                </ul>
                                <div className="btn-wrap">
                                    <a href="/profile" className="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-12 mt-3">
                            <div id="party3" className="box" dataAos="zoom-in" dataAosDelay="100">
                                <h3>Tot's Ultimate Party</h3>
                                <ul>
                                    <li><i className="bi bi-check"></i>(2 hours 30 minutes)</li>
                                    <li><i className="bi bi-check"></i> <sup>$</sup>400</li>
                                    <li><i className="bi bi-check"></i> Up to 12 children</li>
                                    <li><i className="bi bi-check"></i> Back party room + front playroom access</li>
                                    <li><i className="bi bi-check"></i> Themed decor</li>
                                    <li><i className="bi bi-check"></i> Guided play + structured activities</li>
                                    <li><i className="bi bi-check"></i> Two structured activities or games</li>
                                    <li><i className="bi bi-check"></i> Fun tot-friendly music</li>
                                    <li><i className="bi bi-check"></i> Setup, hosting, and deep cleanup</li>
                                    <li><i className="bi bi-check"></i> Party favors for each child</li>
                                    <li><i className="bi bi-check"></i> Keepsake for birthday tot</li>
                                    <li><i className="bi bi-check"></i> Food & drinks provided by family</li>
                                </ul>
                                <div className="btn-wrap">
                                    <a href="/profile" className="btn-buy">Book Now</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="container">
                <div className="section-title d-flex justify-content-center" dataAos="fade-up">
                    <p id="upcoming-events">Our Upcoming Events</p>
                </div>
                <div className="row justify-content-center" dataAos="fade-up">
                    <iframe src="https://calendar.google.com/calendar/embed?src=c_1c1732ecaaf7f410a35bd17215c56ce7c88961913f9fba714a0684c82d41aa59%40group.calendar.google.com&ctz=UTC" style={{ border: 0 }} width="800" height="600" frameBorder="0" scrolling="no"></iframe>s
                </div>
            </section>
        </div>
    );
}

export default PartyPage;