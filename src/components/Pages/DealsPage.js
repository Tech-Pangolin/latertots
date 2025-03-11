import React from 'react';

function DealsPage() {
    return (
        <div className='bg-deals'>

            <div className="row">
                <div className="col d-flex justify-content-center mt-5">
                    <img src="assets/img/deals/header.png" className='img-fluid mt-5' />
                </div>
            </div>
            <section className="mx-5">
                <div className="container">
                    <div className="row content mx-5">
                        <p>You can explore our flexible pricing options designed to fit your schedule. Whether it’s a quick drop-in or a longer stay, we’ve got you covered at just $20 per hour per child, $7 extra per child, snacks included! Be sure to check out our different ways to save for even more value.</p>
                    </div>

                    <div className="row content">
                        <div className="col">
                            <div className="drop-in-box">
                                <h2 className="text-center">Drop in</h2>
                                <p>Little Saver: $350 for 20 hours (Average $17.50/hour)</p>
                                <p>Big saver: $650 for 40 hours (Average $16.25/hour)</p>
                                <p>Refer a friend who signs up for a package, and both families get 2 free hours.</p>
                            </div>
                            <div className="classes-box">
                                <h2 className="text-center">Classes</h2>
                                <div>
                                    <h3>Tot explores & Ready, Set, Pre-K</h3>
                                    <p>Book a full month with a reduced rate of $22 per hour (8 sessions = 1 month)
                                    </p>
                                </div>
                                <div className='indent-class'>
                                    <h3>Tot-ally Fun Saturdays</h3>
                                    <p>Receive a 10% discount when booking for the entire month.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className='row content'>
                        <div className='col'>
                            <p className="bonus">Bonus: A choice between a Later Tots shirt or tote bag as a thank-you for your commitment. Inculded in both packages</p>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    );
}

export default DealsPage;