import React, { useEffect, useState } from 'react';


const FooterBar = () => {
    return (
        <footer id="footer">
            <div className="footer-top">
                <div className="container">
                    <div className="row">

                        <div className="col-lg-4 col-md-6">
                            <div className="footer-info">
                                <img src="./assets/img/footer/footer.png" className='img-fluid' />


                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 footer-links">
                            <div className="social-links mt-3 text-center">
                                <a href="#" className="twitter"><img src="./assets/img/footer/twitter.png" className='img-fluid' /></a>

                                <a href="#" className="instagram"><img src="./assets/img/footer/ig.png" className='img-fluid' /></a>
                                <a href="#" className="facebook"><img src="./assets/img/footer/fb.png" className='img-fluid' /></a>
                                <a href="#" className="linkedin"><img src="./assets/img/footer/linkedin.png" className='img-fluid' /></a>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-6 footer-newsletter">
                            <h4>Our Newsletter</h4>
                            <p>Sign up for event notifications</p>
                            <form action="" method="post">
                                <input type="email" name="email" /><input type="submit" value="Subscribe" />
                            </form>

                        </div>

                    </div>
                </div>
            </div>

            <div className="container">
                <div className="copyright">
                    &copy; Copyright <strong><span>Later Tots</span></strong>. All Rights Reserved
                </div>

            </div>

        </footer >
    );
};
export default FooterBar;