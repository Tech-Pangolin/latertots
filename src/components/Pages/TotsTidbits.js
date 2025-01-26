import React from 'react';



function TotsTidbits() {
    return (
        <div className='bg-white'>
            <div className="container">
                <div className="row">
                    <div className="col">
                        <img src="assets/img/tidbits/starbanner.png" className='img-fluid' />
                    </div>
                </div>
            
            {/* <section id="tidbits" className="tidbits-hero" >
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-12 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">

                        </div>

                    </div>
                </div>


            </section> */}

            <section className="mx-1">
                <div className="container">
                    <div className="section-title" dataAos="fade-up">
                        <h2>Important Information</h2>
                        <p sx={{ color: '#3B38DA' }}>Tots & Tidbits</p>
                    </div>


                </div>
            </section>
            <section id="details" className="details" style={{ paddingTop: 0 }}>
                <div className="container">

                    <div className="row content">
                        <div className="col-md-3" dataAos="fade-right">
                            <img src="assets/img/shapes.png" className="img-fluid page-img" alt="" />
                        </div>
                        <div className="col-md-9" dataAos="fade-up">
                            <h3>Health and Hygiene</h3>
                            {/* <p className="fst-italic">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                                magna aliqua.
                            </p> */}
                            <ul>
                                <li><i className="bi bi-check"></i> If your child is unwell, please keep them at home until they are symptom-free for at least 24 hours, without the aid of medication.</li>
                                <li><i className="bi bi-check"></i> We follow a strict "No Sick Tots" policy to protect all children in our care.</li>
                                <li><i className="bi bi-check"></i> For the health and safety of all children, Later Tots only accepts children who are up to date on their vaccinations.
                                </li>
                                <li><i className="bi bi-check"></i> Cleaning Procedures: Play areas, toys, and high-touch surfaces are cleaned and disinfected several times a day using safe, non-toxic products. Rooms are deep-cleaned daily, and shared items like toys are sanitized between uses. Staff follow strict sanitization practices to keep the environment healthy, and children and staff wash their hands before and after meals,and bathroom use.</li>
                            </ul>
                            {/* <p>
                                Voluptas nisi in quia excepturi nihil voluptas nam et ut. Expedita omnis eum consequatur non. Sed in asperiores aut repellendus. Error quisquam ab maiores. Quibusdam sit in officia
                            </p> */}
                        </div>
                    </div>

                    <div className="row content">
                        <div className="col-md-6 order-1 order-md-2" dataAos="fade-left">
                            <h3>Food Policy</h3>
                            {/* <p>Cupiditate placeat cupiditate placeat est ipsam culpa. Delectus quia minima quod. Sunt saepe odit aut quia voluptatem hic voluptas dolor doloremque.</p> */}
                            <ul>
                                <li><i className="bi bi-check"></i> Outside food and drinks are permitted, but must not contain peanuts, gum, or candy.
                                </li>
                                <li><i className="bi bi-check"></i> We offer lunch and dinner for an additional fee. A microwave and refrigerator are available for use.
                                </li>
                            </ul>

                        </div>
                        <div className="col-md-6 order-2 order-md-1" dataAos="fade-up">
                            <h3>What to Bring</h3>

                            <ul>
                                <li><i className="bi bi-check"></i>
                                    Please pack any items your tot might need, such as diapers, wipes, extra clothes, stuffy, and sippy cups.</li>

                                <li><i className="bi bi-check"></i>
                                    Use of our wipes or diapers will result in a $1.50 charge per use.</li>
                            </ul>
                        </div>
                    </div>



                    <div className="row content">
                        <div className="col-md-4 order-1 order-md-2" dataAos="fade-left">
                            <img src="assets/img/kidafro.jpg" className="img-fluid page-img" alt="" />
                        </div>
                        <div className="col-md-8 order-2 order-md-1" dataAos="fade-up">
                            <h3>Pick-Up & Drop-Off Policies:</h3>
                            <ul>
                                <li><i className="bi bi-check"></i> Drop-Off: Sign in upon arrival, and disinfect your tot's hands before entering the play room.
                                </li>
                                <li><i className="bi bi-check"></i> Pick-Up: Authorized individuals must show ID at pick-up for security purposes.  </li>
                                <li><i className="bi bi-check"></i> Timely Pick-Up: Late pick-up fees apply after the scheduled time at $5 per minute.
                                </li>
                                <li><i className="bi bi-check"></i>Safety: Tots will only be released to individuals listed on the approved pick-up list.
                                </li>
                                <li><i className="bi bi-check"></i> Changes: Update us in advance if someone else will be picking up your child.
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </section>
        </div>
        </div>
    );
}

export default TotsTidbits;