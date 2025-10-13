import React, { useEffect, useState } from 'react';


const FooterBar = () => {
    const [sendSuccess, setSendSuccess] = useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);

        const data = {
            name: "Newsletter Subscriber",
            email: formData.get('email'),
            subject: "Add to Newsletter",
            message: "No message",
        };
        console.log(data)
        fetch("https://nodemailer-base.onrender.com/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {setSendSuccess(true); console.log(data)})
            .catch(error => console.error("Error:", error));
    }
    return (
        <footer id="footer">
            <div className="footer-top">
                <div className="container">
                    <div className="row">

                        <div className="col-lg-4 col-md-6">
                            <div className="footer-info">
                                <img src="/assets/img/footer/footer.png" className='img-fluid' />


                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 footer-links">
                            <div className="social-links mt-3 text-center">
                                <a href="https://x.com/l8tertots/" className="twitter"><img src="/assets/img/footer/twitter.png" className='img-fluid' /></a>

                                <a href="https://www.instagram.com/l8tertots/" className="instagram"><img src="/assets/img/footer/ig.png" className='img-fluid' /></a>
                                <a href="https://www.facebook.com/profile.php?id=61567825782544" className="facebook"><img src="/assets/img/footer/fb.png" className='img-fluid' /></a>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-6 footer-newsletter">
                            <h4>Our Newsletter</h4>
                            <p>Sign up for event notifications</p>
                            <form onSubmit={handleSubmit}>
                              <input type="email" name="email" required />
                                <input type="submit" value={!sendSuccess ? "Subscribe" : "Sent!"} />
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