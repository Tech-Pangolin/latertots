import React from 'react';

function AboutPage() {
    return (
        <div className='bg-white' style={{ background: 'url(assets/img/about/aboutbg.png) no-repeat top center fixed', backgroundSize: 'cover' }}>
            {/* <section id="teamTots" className="teamTots" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">

                        </div>

                    </div>
                </div>


            </section> */}


            <section className="container meet">
                <div className="row mb-1">
                    <div className="section-title" dataAos="fade-up">
                        <h1 className="text-center">"Where Passion Meets Playtime"</h1>
                        {/* <h2>Meet</h2>
                        <p sx={{ color: '#3B38DA' }}>Where Passion Meets Playtime</p> */}
                    </div>
                    {/* <div className="col-md-12"><h2 className="text-center"><i>"Where Passion Meets Playtime"</i></h2>
                    </div> */}
                </div>
                <div className="row">
                    <div className="col-12">
                        <h3 className='text-center'>Meet Our Amazing Tot-Tenders</h3>
                        <div className="subcontainer">
                        <p className="text-center">Our team is made up of trained professionals who are passionate about creating a nurturing environment where children can thrive. Every tot-tender is certified in First Aid and CPR and has undergone thorough background checks, ensuring the highest standards of safety and care for your tots.
                            We are dedicated to making every moment at Later Tots a memorable one.
                            We treat your tots like our own, providing the love and attention they deserve.</p>
                            </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col"><img src="assets/img/about/tottender.png" className='img-fluid' /></div>
                    <div className="col"><img src="assets/img/about/totender1.jpg" className='img-fluid' /></div>
                    <div className="col"><img src="assets/img/about/totender2.jpg" className='img-fluid' /></div>
                    <div className="col"><img src="assets/img/about/totender3.jpg" className='img-fluid' /></div>
                </div>
                <div className="row mt-5">
                    <div className="col-12">
                        <h3 className='text-center'>Amber Brown, Owner & Lead Tot-Tender</h3> 
                        <div className="d-flex justify-content-center"><img src="assets/img/about/ambercir.png" className='text-center amber-photo img-fluid' /></div>
                        <div className="subcontainer">
                        <p className="text-center mt-3">
                            Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p className="text-center">
                            Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p className="text-center">With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>
                        </div>
                    </div>
                    <div className="col-2 d-flex justify-content-center">
                       
                    </div>
                </div>

               

            </section>


        </div>
    );
}

export default AboutPage;