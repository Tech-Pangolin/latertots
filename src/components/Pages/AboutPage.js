import React from 'react';

function AboutPage() {
    return (
        <>
            <section class="breadcrumbs mt-0" >
                <div class="container">

                    <div class="d-flex justify-content-between align-items-center">
                        <h2>Team Tots</h2>
                        <ol>
                            <li><a href="index.html">Home</a></li>
                            <li>Team Tots</li>
                        </ol>
                    </div>

                </div>
            </section>
            <section id="about" className="about container">
               

                <div className="row content">
                    <div className="col-md-4" dataAos="fade-right">
                        <img src="assets/img/about/highchairfunnyface.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                         <div class="section-title" dataAos="fade-up">
                    <h3><i>"Where Passion Meets Playtime"</i></h3>
                </div>
                        <h3>Meet Our Amazing Tot-Tenders</h3>
                        <p>Our team is made up of trained professionals who are passionate about creating a nurturing environment where children can thrive. Every tot-tender is certified in First Aid and CPR and has undergone thorough background checks, ensuring the highest standards of safety and care for your tots. We are dedicated to making every moment at Later Tots a memorable one. We treat your tots like our own, providing the love and attention they deserve.</p>
                        
                    </div>
                </div>

                <div className="row content">
                    <div className="col-md-4 order-1 order-md-2 mt-5" dataAos="fade-left">
                        <img src="assets/img/about/diaperchange.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8 pt-5 order-2 order-md-1" dataAos="fade-up">
                        <h3>Meet Amber Brown, Owner & Lead Tot-tender</h3>
                        <p >
                        Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p>
                        Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p>With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>
                      
                    </div>
                </div>

            </section>

            
        </>
    );
}

export default AboutPage;