import React from 'react';

function AboutPage() {
    return (
        <>
            <section id="about" className="about mx-5">
                <div class="section-title" dataAos="fade-up">
                    <h2>About</h2>
                    <p sx={{color:'#3B38DA'}}>About LaterTots</p>
                </div>
                <div className="row content">
                    <div className="col-md-4 order-1 order-md-2" dataAos="fade-left">
                        <img src="assets/img/logo.png" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8 pt-5 order-2 order-md-1" dataAos="fade-up">
                        <h3>Who We Are</h3>
                        <p className="fst-italic">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                            magna aliqua.
                        </p>
                        <p>
                            Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                            culpa qui officia deserunt mollit anim id est laborum
                        </p>
                        <p>
                            Inventore id enim dolor dicta qui et magni molestiae. Mollitia optio officia illum ut cupiditate eos autem. Soluta dolorum repellendus repellat amet autem rerum illum in. Quibusdam occaecati est nisi esse. Saepe aut dignissimos distinctio id enim.
                        </p>
                    </div>
                </div>

                <div className="row content">
                    <div className="col-md-4" dataAos="fade-right">
                        <img src="assets/img/about/highchairfunnyface.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                        <h3>How it works</h3>
                        <p>Cupiditate placeat cupiditate placeat est ipsam culpa. Delectus quia minima quod. Sunt saepe odit aut quia voluptatem hic voluptas dolor doloremque.</p>
                        <ul>
                            <li><i className="bi bi-check"></i> Ullamco laboris nisi ut aliquip ex ea commodo consequat.</li>
                            <li><i className="bi bi-check"></i> Duis aute irure dolor in reprehenderit in voluptate velit.</li>
                            <li><i className="bi bi-check"></i> Facilis ut et voluptatem aperiam. Autem soluta ad fugiat.</li>
                        </ul>
                        <p>
                            Qui consequatur temporibus. Enim et corporis sit sunt harum praesentium suscipit ut voluptatem. Et nihil magni debitis consequatur est.
                        </p>
                        <p>
                            Suscipit enim et. Ut optio esse quidem quam reiciendis esse odit excepturi. Vel dolores rerum soluta explicabo vel fugiat eum non.
                        </p>
                    </div>
                </div>

                <div className="row content">
                    <div className="col-md-4 order-1 order-md-2 mt-5" dataAos="fade-left">
                        <img src="assets/img/about/diaperchange.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8 pt-5 order-2 order-md-1" dataAos="fade-up">
                        <h3>What we do</h3>
                        <p className="fst-italic">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
                            magna aliqua.
                        </p>
                        <p>
                            Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                            culpa qui officia deserunt mollit anim id est laborum
                        </p>
                        <ul>
                            <li><i className="bi bi-check"></i> Et praesentium laboriosam architecto nam .</li>
                            <li><i className="bi bi-check"></i> Eius et voluptate. Enim earum tempore aliquid. Nobis et sunt consequatur. Aut repellat in numquam velit quo dignissimos et.</li>
                            <li><i className="bi bi-check"></i> Facilis ut et voluptatem aperiam. Autem soluta ad fugiat.</li>
                        </ul>
                    </div>
                </div>

            </section>

            <section id="gallery" className="gallery">
                <div className="container">

                    <div className="section-title" dataAos="fade-up">
                        <h2>Gallery</h2>
                        <p>Check our Gallery</p>
                    </div>
Photos coming soon
                    {/* <div className="row g-0" dataAos="fade-left">

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="100">
                                <a href="assets/img/about/2kidsblocks.jpg" className="gallery-lightbox">
                                    <img src="assets/img/about/2kidsblocks.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="150">
                                <a href="assets/img/gallery/gallery-2.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-2.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="200">
                                <a href="assets/img/gallery/gallery-3.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-3.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="250">
                                <a href="assets/img/gallery/gallery-4.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-4.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="300">
                                <a href="assets/img/gallery/gallery-5.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-5.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="350">
                                <a href="assets/img/gallery/gallery-6.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-6.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="400">
                                <a href="assets/img/gallery/gallery-7.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-7.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-4">
                            <div className="gallery-item" dataAos="zoom-in" data-aos-delay="450">
                                <a href="assets/img/gallery/gallery-8.jpg" className="gallery-lightbox">
                                    <img src="assets/img/gallery/gallery-8.jpg" alt="" className="img-fluid" />
                                </a>
                            </div>
                        </div> 

                    </div>*/}

                </div>
            </section>
        </>
    );
}

export default AboutPage;