import React from 'react';

function AboutPage() {
    return (
        <div className='bg-white' style={{ background: 'url(assets/img/about/aboutbg.png) no-repeat top center fixed', backgroundSize: 'cover' }}>
            <section className="container meet">
                <div className="row mb-1">
                    <div className="section-title" dataAos="fade-up">
                        <h1 className="text-center">"Where Passion Meets Playtime"</h1>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <h3 className='text-center'>Meet Our Tot-Tenders</h3>
                        <div className="subcontainer">
                            <p className="text-center">At Later Tots, our Tot-Tenders aren't just staff—they're fun-makers,storytellers, and champions of play! Each member of our team is a trained professional who brings energy, creativity, and a whole lot of heart to every tot's day.
                            </p>
                            <ul className="meet-list">
                                <li><i class="bi bi-check-square-fill"></i> <span>Certified in First Aid & CPR</span>—because safety comes first!</li>
                                <li><i class="bi bi-check-square-fill"></i> <span>Background-checked & trusted</span>—peace of mind for you, endless fun for them!
                                </li>
                                <li><i class="bi bi-check-square-fill"></i> <span>Experts in play & engagement</span>—turning every visit into an adventure!
                                </li>
                            </ul>
                            <p>Whether it’s crafting the perfect playtime, leading a silly song, or simply making your tot feel right at home, our Tot-Tenders are here to make every drop, play, and stay unforgettable!</p>
                        </div>
                    </div>
                </div>
              
                <div className="row mt-5">
                    <div className="col-12">
                        <h3 className='text-center'>Amber Brown, Owner & Lead Tot-Tender</h3>
                        <div className="d-flex justify-content-center"><img src="assets/img/about/ambercir.png" className='text-center amber-photo img-fluid' /></div>
                        <div className="subcontainer">
                            <p className="text-center mt-3">
                            Hey there, I'm Amber Brown—the big tot behind Later Tots! With over 20 years of experience in caring for children and a degree in Early Childhood Development, I’ve spent my life creating spaces where little ones can giggle, grow, and explore. From my years as a dedicated nanny to now running Later Tots, play has always been my passion! I dreamed of building a place where tots can dive into endless fun while their grown-ups feel at ease. Later Tots isn’t just a play space—it’s a community, a place where curiosity runs wild, friendships bloom, and every visit is an adventure.
</p>
                            <p className="text-center">
                            I can’t wait to welcome you and your tot—let's make some playful memories together! 
    </p>
                        
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