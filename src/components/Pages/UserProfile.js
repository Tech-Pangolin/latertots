import ContactsTable from '../Shared/ContactsTable';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { useLocation } from 'react-router-dom';
import ChildCard from '../Shared/ChildCard';
import UserForm from '../Shared/UserForm';
import ChildRegistration from './ChildRegistration';
import ContactRegistration from './ContactRegistration';
import AlertContainer from '../Shared/AlertContainer';
import { useChildrenRQ } from '../../Hooks/query-related/useChildrenRQ';
import { useContactsRQ } from '../../Hooks/query-related/useContactsRQ';
import { useAlerts } from '../../Hooks/useAlerts';
import ChangePasswordForm from '../ChangePasswordForm';
import { set } from 'lodash';
import { useReservationsByMonthDayRQ } from '../../Hooks/query-related/useReservationsByMonthDayRQ';
import { useMemo } from 'react';


const UserProfile = () => {
  const { currentUser } = useAuth();
  const { data: children = [] } = useChildrenRQ(true); // Force user mode to show only user's own children
  const { data: contacts = [] } = useContactsRQ(true); // Force user mode to show only user's own contacts
  const { data: reservations = [] } = useReservationsByMonthDayRQ();
  const location = useLocation();
  const { alerts, addAlert, removeAlert } = useAlerts();

  const [openChildModal, setOpenChildModal] = useState(false);
  const [openContactsModal, setOpenContactsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [editingChild, setEditingChild] = useState(null);

  // Payment data processing
  const pendingCheckoutSession = useMemo(() => {
    return reservations.find(res => 
      res.status === 'picked-up' && 
      res.dropOffPickUp?.finalCheckoutUrl
    );
  }, [reservations]);

  const paymentHistory = useMemo(() => {
    return reservations
      .filter(res => res.status === 'paid' && res.stripePayments?.full)
      .map(res => ({
        serviceDate: res.start,
        childName: res.title,
        amount: res.dropOffPickUp?.finalAmount || 0,
        paymentDate: res.updatedAt
      }))
      .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
  }, [reservations]);

  // Handle tab switching from navigation state
  useEffect(() => {
    if (location.state?.switchToTab) {
      setActiveTab(location.state.switchToTab)
    }
  }, [location.state]);

  // TODO: Open a dialog to show/edit child details when clicking on a child's name
  // Dialog state
  const [selectedChild, setSelectedChild] = useState(null);
  const [open, setOpen] = useState(false);
  const handleNameClick = (child) => {
    setSelectedChild(child);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleEditChildFxn = (child) => {
    setEditingChild(child);
    setOpenChildModal(true);
  };

  const handleCloseModalFxn = () => {
    setOpenChildModal(false);
    setEditingChild(null);
  };

  function canSchedule() {
    const { StreetAddress, City, State, Zip, CellNumber } = currentUser || {};
    if (!StreetAddress || !City || !State || !Zip || !CellNumber) return false;
    if (children.length === 0) return false;
    return true;
  }

  return (
    <div className="container-fluid bg-blue">

      <div className="row">

        {/* Avatar and Book Now Button  */}
        <div className='col-md-4'>
          <div className="row mt-5">
            <div className='col-12'>
              <h1 className="text-center">{currentUser?.Name}</h1>
            </div>
            <div className="col-12 d-flex justify-content-center">
              <img className="rounded-circle" width="250px" height="250px" src={currentUser.PhotoURL ? currentUser.PhotoURL : "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} />
            </div>
            {!canSchedule() && <span className="text-danger my-3 text-center">Complete your profile to book with us!</span>}
            <div className='col-12 d-flex justify-content-center mt-5'>
              <button onClick={() => window.location.href = "/schedule"} disabled={!canSchedule()} className="border px-5 py-3 p-1 pink-text blink-text">Book Now</button>
            </div>
          </div>
        </div>


        <div className='col-md-7 profile'>
          <AlertContainer alerts={alerts} removeAlert={removeAlert} />

          {/* Tab Navigation Header */}
          <ul className="nav nav-tabs mt-5" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                id="home-tab"
                data-bs-toggle="tab"
                data-bs-target="#home-tab-pane"
                type="button"
                role="tab"
                aria-controls="home-tab-pane"
                aria-selected={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
              >
                User Info
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'children' ? 'active' : ''}`}
                id="profile-tab"
                data-bs-toggle="tab"
                data-bs-target="#profile-tab-pane"
                type="button"
                role="tab"
                aria-controls="profile-tab-pane"
                aria-selected={activeTab === 'children'}
                onClick={() => setActiveTab('children')}
              >
                Children
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'contacts' ? 'active' : ''}`}
                id="contact-tab"
                data-bs-toggle="tab"
                data-bs-target="#contact-tab-pane"
                type="button"
                role="tab"
                aria-controls="contact-tab-pane"
                aria-selected={activeTab === 'contacts'}
                onClick={() => setActiveTab('contacts')}
              >
                Contacts
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'payment' ? 'active' : ''}`}
                id="payment-tab"
                data-bs-toggle="tab"
                data-bs-target="#payment-tab-pane"
                type="button"
                role="tab"
                aria-controls="payment-tab-pane"
                aria-selected={activeTab === 'payment'}
                onClick={() => setActiveTab('payment')}
              >
                Payment Information
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                id="security-tab"
                data-bs-toggle="tab"
                data-bs-target="#security-tab-pane"
                type="button"
                role="tab"
                aria-controls="security-tab-pane"
                aria-selected={activeTab === 'security'}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
            </li>
          </ul>


          <div className="tab-content" id="myTabContent">

            {/* currentUser's Profile Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'home' ? 'show active' : ''}`} id="home-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabIndex="0">
              <div className='mt-5'>
                <UserForm addAlert={addAlert} />
              </div>
            </div>

            {/* currentUser's Children Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'children' ? 'show active' : ''}`} id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">
              <div className='px-5 py-5'>
                <div className='row'>
                  <div className="col-12 col-lg-2"> <h3 className="mt-2">Children</h3></div>
                  <div className="col-9">
                    <button type="button" className="btn btn-outline-primary btn-lg" onClick={() => setOpenChildModal(true)}>
                      Add Children&nbsp;<i className="bi bi-person-plus-fill"></i>
                    </button>
                  </div>
                </div>

                <div
                  className={`modal fade ${openChildModal ? 'show' : ''}`}
                  style={{ display: openChildModal ? 'block' : 'none' }}
                  tabIndex="-1"
                  aria-labelledby="newChildModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        <div className="d-flex justify-content-end">
                          <button type="button" className="btn-close" onClick={handleCloseModalFxn} aria-label="Close"></button>
                        </div>
                        <ChildRegistration setOpenStateFxn={handleCloseModalFxn} addAlertFxn={addAlert} editingChild={editingChild} />
                      </div>
                    </div>
                  </div>
                </div>
                {openChildModal && <div className="modal-backdrop fade show"></div>}

                <div className="mt-3 experience">
                  <div className="row">
                    {children.length > 0 &&
                      children.map((child) => (<ChildCard key={child.id} child={child} onNameClick={handleNameClick} onEditChildFxn={handleEditChildFxn} />))
                    }
                  </div>
                  {children.length === 0 && <p className='mt-5'>No children added yet.</p>}
                </div>
              </div>
            </div>

            {/* currentUser's Contacts Tab Content */}
            <div className={`tab-pane fade ${activeTab === 'contacts' ? 'show active' : ''}`} id="contact-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabIndex="0">
              <div className='px-lg-5 py-lg-5'>
                <div className=" row"  >
                  <div className="col-12 col-lg-2 "><h4 className="mt-2">Contacts</h4></div>
                  <div className="col-12 col-lg-3">
                    <button type="button" className="btn btn-outline-primary btn-lg" onClick={() => setOpenContactsModal(true)}>
                      Add Contact&nbsp;<i className="bi bi-person-plus-fill"></i>
                    </button>
                  </div>
                </div>
                <div className='row'>
                  <div className="col-12">
                    <ContactsTable contacts={contacts} />
                  </div>
                </div>
              </div>
            </div>
            <div className={`tab-pane fade ${activeTab === 'payment' ? 'show active' : ''}`} id="payment-tab-pane" role="tabpanel" aria-labelledby="payment-tab" tabIndex="0">
              <div className='px-5 py-5'>
                <div className=" row"  >
                  <div className="col-12"><h4 className="mt-2">Payment Information</h4></div>
                </div>
                <h5 className="mt-5">Payment</h5>
                
                {/* Pending Payment Alert */}
                {pendingCheckoutSession && (
                  <div className="alert alert-warning d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '2rem' }}></i>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Payment Due</h6>
                      <p className="mb-2">Complete payment for your child's recent service.</p>
                      <a 
                        href={pendingCheckoutSession.dropOffPickUp.finalCheckoutUrl} 
                        className="btn btn-warning"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Complete Payment - ${(pendingCheckoutSession.dropOffPickUp.finalAmount / 100).toFixed(2)}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Payment History */}
                <h6 className="mt-4">Payment History</h6>
                {paymentHistory.length > 0 ? (
                  <div className="list-group">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="list-group-item">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            {new Date(payment.serviceDate).toLocaleDateString()}
                          </h6>
                          <small className="text-success fw-bold">
                            ${(payment.amount / 100).toFixed(2)}
                          </small>
                        </div>
                        <p className="mb-1">{payment.childName}</p>
                        <small className="text-muted">
                          Paid: {new Date(payment.paymentDate).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No payment history yet.</p>
                )}
              </div>
            </div>
            <div className={`tab-pane fade ${activeTab === 'security' ? 'show active' : ''}`} id="security-tab-pane" role="tabpanel" aria-labelledby="security-tab" tabIndex="0">
              <div className='px-5 py-5'>
                <div className=" row"  >
                  <div className="col-2"><h4 className="mt-2">Security</h4></div>
                </div>
                <h5 className="mt-5">Change Password</h5>
                <ChangePasswordForm />
              </div>
            </div>
          </div>

          <div
            className={`modal fade ${openContactsModal ? 'show' : ''}`}
            style={{ display: openContactsModal ? 'block' : 'none' }}
            tabIndex="-1"
            aria-labelledby="newContactModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body">
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn-close" onClick={() => setOpenContactsModal(false)} aria-label="Close"></button>
                  </div>
                  <ContactRegistration setOpenState={setOpenContactsModal} />
                </div>
              </div>
            </div>
          </div>
          {openContactsModal && <div className="modal-backdrop fade show"></div>}

        </div>
      </div>
    </div>


  );
};

export default UserProfile;