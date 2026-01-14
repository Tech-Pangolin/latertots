import React from 'react';

function DealsPage() {
    const TOP_OF_PAGE_TEXT = "You can explore our flexible pricing options to fit your schedule. Whether it’s a quick drop-in or an extended stay, we have you covered at $25 per hour, with $10 per hour for each additional child, plus snacks.";
    
    return (
        <div className='bg-deals'>

            <div className="row">
                <div className="col d-flex justify-content-center mt-5">
                    <img src="assets/img/deals/header.png" className='img-fluid mt-5' />
                </div>
            </div>
            <section className="mx-5">
                <div className="container">
                    <div className="row content mx-0 mx-md-5">
                        <p class="deals-text">{TOP_OF_PAGE_TEXT}</p>
                    </div>

                    <div className="row content">
                        <div className="col">
                            <div className="drop-in-box">
                                <h2 className="text-center">Drop in</h2>
                                <p>Check out our bulk-hour packages for even more value:</p>
                                <p><span>Little Saver:</span> $440 for 20 hours (Average $22/hour)</p>
                                <p><span>Big saver:</span> $880 for 40 hours (Average $22/hour)</p>
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