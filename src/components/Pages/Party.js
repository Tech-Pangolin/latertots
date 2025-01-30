import React from 'react';

function PartyPage() {
    return (
        <div className='bg-white'>
            <section id="totTivities" className="totTivities" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                            {/* <img src="./assets/img/crayons.png" className='img-fluid' alt='colorful hands' /> */}

                        </div>

                    </div>
                </div>


            </section>
            <section className="container">
                <div class="section-title" dataAos="fade-up">
                    <h2>So much to do!</h2>
                    <p sx={{ color: '#3B38DA' }}>Party Page</p>
                </div>
                <iframe src="https://calendar.google.com/calendar/embed?height=500&wkst=1&ctz=UTC&bgcolor=%23C0CA33&title=Later%20Tots&src=aW5mb0BsYXRlcnRvdHNkcm9waW4uY29t&src=YWRkcmVzc2Jvb2sjY29udGFjdHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%23039BE5&color=%23B39DDB" style={{border:"solid 1px #777"}} width="100%" height="700" frameborder="0" scrolling="no"></iframe>

                <div className="row content mt-5">
                    <div className="col-md-4" dataAos="fade-right">
                        {/* <img src="assets/img/events/smileyhair.jpg" className="img-fluid" alt="" /> */}
                        <img src="assets/img/littleboy.png" className="img-fluid mb-5" alt="" style={{ borderRadius: '50%', width: '300px' }} />
                        <img src="assets/img/littlegirlcolors.jpg" className="img-fluid mb-5" style={{ borderRadius: '50%', width: '300px' }} alt="" />
                        <img src="assets/img/kids3.jpg" className="img-fluid" alt="" style={{ borderRadius: '50%', width: '300px' }} />
                        {/* <img src="assets/img/kids3.jpg" className="img-fluid mt-5" alt="" /> */}
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                        <div class="mb-5">
                            <h3>Tiny Tot Explorers</h3>
                            <h4>(For 2-3-Year-Olds)</h4>
                            <p>Watch your little one embark on a journey of friendship and discovery in our Tiny Tot Explorers class! Perfect for toddlers ready to take on new challenges, this class helps them practice social skills, build communication, and get comfortable with following routines. With engaging circle time and playful activities, your child will have a blast while growing their confidence. Join us on Tuesdays and Thursdays from 10 AM to 2 PM, and let the adventure begin! Price: $25 per/hr class per child (4-hour session)
                            </p>
                        </div>
                        <div class="mb-5">
                            <h3>Ready, Set, Pre-K!</h3>
                            <h4>(For 4-5-Year-Olds)</h4>
                            <p>Jump into the exciting world of learning and laughter with our Ready, Set, Pre-K! class, where older tots get a head start on their pre-k journey. Through imaginative play and hands-on activities, your child will build essential social skills, boost their confidence, and get a taste of what it’s like to be in a classroom setting—all while having tons of fun! Classes run from 10 AM to 2 PM on Mondays and Wednesdays, offering the Price: $25 per/hr per child (4-hour session)
                            </p>
                        </div>
                        <div class="mb-5">
                            <h3>Tot-ally Fun Saturdays</h3>
                            <h4>Unleash your tot's creativity and curiosity with our action-packed Saturday Play Classes!
                            </h4>
                            <p>Imagine a Saturday where your little one explores their artistic side with engaging crafts, dances to fun tunes, and picks up some Spanish along the way—all while making new friends and having a blast. At Later Tots, we believe in creating a balanced mix of fun and learning. Our 3-hour sessions are designed to keep your child entertained and enriched, giving them the perfect blend of play, creativity, and culture.

                            </p>
                            <p>Every Saturday, your tot will dive into hands-on crafts, enjoy lively music sessions, and embark on a mini-language adventure in Spanish. With plenty of time for snacks and free play, your child will leave with a smile on their face and stories to tell. This is the perfect way to add some excitement to their weekend and give you a well-deserved break. Sign up now and let your child experience the joy of learning through play!
                                Price: $25/hr per child (3-hour session)
                            </p>
                        </div>

                    </div>
                </div>
            </section>


        </div>
    );
}

export default PartyPage;