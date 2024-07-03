import React from 'react';

function EventPage() {
    return (
        <>
        <section id="hero" style={{background:"black", padding:0}}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-7 pt-5 pt-lg-0 order-2 order-lg-1 d-flex align-items-center">
                        <img src="./assets/img/events/colorhands.jpg" className='img-fluid' alt='colorful hands' />
                        {/* <div dataAos="zoom-out">
                            <h1>Welcome to LaterTots</h1>
                            <h2>We are team of talented designers making websites with Bootstrap</h2>
                            <div className="text-center text-lg-start">
                                <a href="/register" className="btn-get-started scrollto">Get Started</a>
                            </div>
                        </div> */}
                    </div>
                    {/* <div className="col-lg-4 order-1 order-lg-2 hero-img" dataAos="zoom-out" dataAosDelay="300">
                        <img src="./assets/img/logo.png" className="img-fluid animated" alt="" />
                    </div> */}
                </div>
            </div>

            {/* <svg className="hero-waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28 " preserveAspectRatio="none">
                <defs>
                    <path id="wave-path" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                </defs>
                <g className="wave1">
                    <use xlinkHref="#wave-path" x="50" y="3" fill="rgba(255,255,255, .1)" />
                </g>
                <g className="wave2">
                    <use xlinkHref="#wave-path" x="50" y="0" fill="rgba(255,255,255, .2)" />
                </g>
                <g className="wave3">
                    <use xlinkHref="#wave-path" x="50" y="9" fill="#fff" />
                </g>
            </svg> */}

        </section>
            <section id="about" className="about mx-5">
                <div class="section-title" dataAos="fade-up">
                    <h2>Events</h2>
                    <p sx={{ color: '#3B38DA' }}>Our Events</p>
                </div>
             

                <div className="row content">
                    <div className="col-md-4" dataAos="fade-right">
                        <img src="assets/img/events/smileyhair.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8" dataAos="fade-up">
                        <h3>We also do events!</h3>
                        <p>Cupiditate placeat cupiditate placeat est ipsam culpa. Delectus quia minima quod. Sunt saepe odit aut quia voluptatem hic voluptas dolor doloremque.</p>
                        <ul>
                            <li><i className="bi bi-check"></i> Birthday Parties</li>
                            <li><i className="bi bi-check"></i> Saturday Camps</li>
                            <li><i className="bi bi-check"></i> Special Events</li>
                        </ul>
                        {/* <p>
                            Qui consequatur temporibus. Enim et corporis sit sunt harum praesentium suscipit ut voluptatem. Et nihil magni debitis consequatur est.
                        </p>
                        <p>
                            Suscipit enim et. Ut optio esse quidem quam reiciendis esse odit excepturi. Vel dolores rerum soluta explicabo vel fugiat eum non.
                        </p> */}
                    </div>
                </div>

                {/* <div className="row content">
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
                </div> */}

            </section>

           
        </>
    );
}

export default EventPage;