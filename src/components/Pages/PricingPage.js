import React from 'react';

function AboutPage() {
    return (
        <>
            <section id="about" className="about mx-5">
                <div class="section-title" dataAos="fade-up">
                    <h2>Pricing</h2>
                    <p sx={{color:'#3B38DA'}}>Our Pricing</p>
                </div>
              
                <div className="row content">
                    <div className="col-md-4 order-1 order-md-2 mt-5" dataAos="fade-left">
                        <img src="assets/img/about/diaperchange.jpg" className="img-fluid" alt="" />
                    </div>
                    <div className="col-md-8 pt-5 order-2 order-md-1" dataAos="fade-up">
                        <h3>What we do</h3>
                      
                        <ul>
                            <li><i className="bi bi-check"></i> We charge $25/hour with a 2 hour minimum</li>
                            <li><i className="bi bi-check"></i> A deposit upon reservation holds your spot</li>
                            <li><i className="bi bi-check"></i> Children ages 1 to 11 are welcome</li>
                        </ul>
                    </div>
                </div>

            </section>

          
        </>
    );
}

export default AboutPage;