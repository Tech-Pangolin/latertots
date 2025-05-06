import React from 'react';



function TotsTidbits() {
    return (
        <div className='tidbits-bg py-5' >
            <div className="container">
                <div className="row">
                    <div className="col-2">
                        <img src="assets/img/tidbits/important.png" className='img-fluid' style={{ width: "100%" }} />
                    </div>
                    <div className="col-10 d-flex justify-content-center">
                        <img src="assets/img/tidbits/totstidbitsheader.png" className='img-fluid' style={{ width: "80%" }} />
                    </div>
                </div>
            </div>
            <section id="details" className="tidbits mt-5" style={{ paddingTop: '20px' }}>
                <div className="container">
                    <div className="row content d-flex justify-content-between">
                        <div className="col-md-12">
                            <h4>Tot-ally Prepared <i class="bi bi-backpack2" style={{ color: "green" }}></i></h4>
                            <ul>
                                <li>Please pack any essentials your tot might need, such as diapers, wipes, and a change of clothes.</li>
                                <li>Tots who aren’t potty trained will be changed standing when needed.</li>
                                <li>A $1.50 per item charge will apply for the use of our diapers or wipes.</li>
                            </ul>
                            <h4>Pick-Up & Drop-Off Made Easy!  <i class="bi bi-car-front" style={{ color: "blue" }}></i></h4>
                            <ul>
                                <li>Drop-Off: Sign in when you arrive and give your tot's hands a quick clean before they jump into playtime!</li>
                                <li>Pick-Up: For safety, ID is required for all authorized pick-ups. <i class="bi bi-person-vcard-fill"></i></li>
                                <li>Safety First: Tots will only be released to approved individuals on the pick-up list. <i class="bi bi-check-circle-fill"></i></li>
                                <li>Plan Ahead: Let us know in advance if someone new will be picking up your tot! <i class="bi bi-chat-left-dots"></i></li>
                                <li>4-hour daily play limit per day. <i class="bi bi-patch-exclamation-fill"></i></li>
                            </ul>
                            <h4>Snack Time & Food Policy <i class="bi bi-cup-hot" style={{ color: "red" }}></i> <i class="bi bi-ban" style={{ color: "red" }}></i></h4>
                            <ul>
                                <li>To keep our space safe and tidy, outside food and drinks are not permitted.
                                </li>
                                <li>We provide small, tot-friendly snacks to keep little ones fueled for play!
                                </li>
                            </ul>
                            <h4>Sparkling Clean Playtime! <i class="bi bi-stars" style={{ color: "orange" }}></i></h4>
                            <ul>
                                <li>Play areas, toys, and high-touch surfaces are cleaned throughout the day using safe, non-toxic products.</li>
                                <li>Shared toys are sanitized between uses, and our play space gets a deep clean daily.</li>
                                <li>Everyone washes their hands before and after snacks and bathroom use to keep the fun germ-free!</li>
                            </ul>
                            <h4>Healthy & Happy Tots! <i class="bi bi-star-fill" style={{ color: "orange" }}></i></h4>
                            <ul>
                                <li>If your tot is feeling under the weather, please keep them home until they're symptom-free for 24 hours.</li>
                                <li>To keep playtime safe for everyone, we have a No Sick Tots policy.</li>
                                <li>All tots must be up to date on vaccinations to join the fun.</li>
                            </ul>                            
                        </div>                       
                    </div>
                </div>
            </section>
        </div>
    );
}

export default TotsTidbits;