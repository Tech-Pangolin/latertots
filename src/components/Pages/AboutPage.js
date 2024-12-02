import React from 'react';

function AboutPage() {
    return (
        <div className='bg-white'>
            <section id="teamTots" className="teamTots" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">

                        </div>

                    </div>
                </div>


            </section>


            <section className="container">
                <div className="row mb-5">
                    <div className="section-title" dataAos="fade-up">
                        <h2>Meet</h2>
                        <p sx={{ color: '#3B38DA' }}>Where Passion Meets Playtime</p>
                    </div>
                    {/* <div className="col-md-12"><h2 className="text-center"><i>"Where Passion Meets Playtime"</i></h2>
                    </div> */}
                </div>


                <div className='row'>
                    <div className="col-3">  <img src="assets/img/about/amber-bio.png" style={{transform: 'rotate(10deg)' }} className="img-fluid"/></div>
                    <div className="col">
                        <h3 className='text-center'>Meet Amber Brown</h3>
                        <h3 className='text-center'>Owner & Lead Tot-tender</h3>
                        <p className="text-center">
                            Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p className="text-center">
                            Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p className="text-center">With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>
                    </div>

                </div>



                {/* <div class="row">
                    <div class="col-md-12">
                        <h3 className='text-center'>Meet Amber Brown</h3>
                        <div className="d-flex justify-content-center">
                 
                            <img src="assets/img/about/amber-bio.png" style={{ width: '200px', transform: 'rotate(10deg)' }} />
                        </div>
                        <h3 className='text-center'>Owner & Lead Tot-tender</h3>
                        <p className="text-center">
                            Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p className="text-center">
                            Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p className="text-center">With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>

                    </div>
                </div> */}
                <div className="row content mt-5">
                    <div className="col-12">
                        <h3 className='text-center'>Meet Our Amazing Tot-Tenders</h3>
                        <div className="d-flex justify-content-center">
                           {/* <img src="assets/img/about/tottender.png" />                     */}
                        </div>
                        <p className='mt-5 text-center'>Our team is made up of trained professionals who are passionate about creating a nurturing environment where children can thrive. Every tot-tender is certified in First Aid and CPR and has undergone thorough background checks, ensuring the highest standards of safety and care for your tots. We are dedicated to making every moment at Later Tots a memorable one. We treat your tots like our own, providing the love and attention they deserve.</p>
                    </div>

                </div>
                <div className="row">
                    <div className="col"><img src="assets/img/about/tottender.png" className='img-fluid'/></div>
                    <div className="col"><img src="assets/img/about/totender1.jpg" className='img-fluid'/></div>
                    <div className="col"><img src="assets/img/about/totender2.jpg" className='img-fluid'/></div>
                    <div className="col"><img src="assets/img/about/totender3.jpg" className='img-fluid'/></div>
                </div>
                {/* <div className="row content">
                    <div className="col-5">
                        <h3 className='text-center'>Meet Our Amazing Tot-Tenders</h3>
                        <div className="d-flex justify-content-center">
                            <div class="losange" style={{width:'150px', height:'150px', marginTop:'20px'}}>
                                <div class="los1">
                                    <img src="assets/img/about/tottender.png" />
                                </div>
                            </div>
                        </div>
                        <p className='mt-5'>Our team is made up of trained professionals who are passionate about creating a nurturing environment where children can thrive. Every tot-tender is certified in First Aid and CPR and has undergone thorough background checks, ensuring the highest standards of safety and care for your tots. We are dedicated to making every moment at Later Tots a memorable one. We treat your tots like our own, providing the love and attention they deserve.</p>
                    </div>
                    <div className="col">
                        <h3 className='text-center'>Meet Amber Brown</h3>
                        <div className="d-flex justify-content-center">
                          
                                    <img src="assets/img/about/amber-bio.png" style={{width:'200px',transform: 'rotate(10deg)'}}/>
                             
                        </div>
                        <h3 className='text-center'>Owner & Lead Tot-tender</h3>
                        <p >
                            Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p>
                            Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p>With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>

                    </div>
                </div>
                <div className="row content">
                    <div className="col-md-3" dataAos="fade-right">
                        <img src="assets/img/about/tottender.png" className="img-fluid page-img" style={{ width: '250px' }} alt="" />
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                        <div dataAos="fade-up">
                            <h3 className='mt-5'>Meet Our Amazing Tot-Tenders</h3>
                            <p className='mt-5'>Our team is made up of trained professionals who are passionate about creating a nurturing environment where children can thrive. Every tot-tender is certified in First Aid and CPR and has undergone thorough background checks, ensuring the highest standards of safety and care for your tots. We are dedicated to making every moment at Later Tots a memorable one. We treat your tots like our own, providing the love and attention they deserve.</p>

                        </div>

                    </div>
                </div>

                <div className="row content mt-3">
                    <div className="col-md-4 order-1 order-md-2 mt-5" dataAos="fade-left">
                        <img src="assets/img/about/amber.jpg" className="img-fluid page-img mt-4 amber-about-img" alt="" style={{ width: '250px' }} />
                    </div>
                    <div className="col-md-8 pt-5 mt-5 order-2 order-md-1" dataAos="fade-up">
                        <h3 className='mb-5'>Meet Amber Brown, Owner & Lead Tot-tender</h3>
                        <p >
                            Amber Brown is the heart and soul behind Later Tots. With over twenty years of experience in child care and more than a decade as a dedicated nanny, Amber has made a profound impact on countless families. She holds a degree in Early Childhood Development, which has fueled her passion for bridging the gaps between childcare and the diverse needs of families.

                        </p>
                        <p>
                            Caring for tots has always been Amber's calling, making her career choice easy and natural. Her hard work, dedication, and genuine love for what she does shine through in every interaction. Amber is committed to creating a safe, nurturing, and joyful environment at Later Tots, where every child can thrive.

                        </p>
                        <p>With high hopes and great enthusiasm, Amber is excited to see Later Tots grow into a beloved community resource, where tots and their families feel supported, cared for, and always welcome.</p>

                    </div>
                </div> */}

            </section>


        </div>
    );
}

export default AboutPage;