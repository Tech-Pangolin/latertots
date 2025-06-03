import React, { useRef, useState, useEffect, useCallback } from 'react';
import DashboardCalendar from '../Shared/DashboardCalendar';
import AdminCalendarInteractionColumn from './AdminCalendarInteractionColumn';
import { AdminPanelContextProvider } from './AdminPanelContext';

export default function DashHome() {
  // For measuring the calendar's height
  const calCardRef = useRef(null);
  const [calHeight, setCalHeight] = useState(0);

  // Measure the calendar card’s full height
  const measure = useCallback(() => {
    const el = calCardRef.current;
    if (el) {
      setCalHeight(el.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    // Initial measurement
    measure();
    // Re-measure on window resize
    window.addEventListener('resize', measure);
    // Observe the calendar card itself for any size changes (zoom, reflow, etc.)
    let resizeObserver;
    if (calCardRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(calCardRef.current);
    }
    return () => {
      window.removeEventListener('resize', measure);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [measure]);

  return (
    <>
      <h1 className="h2">Owner's Dashboard</h1>
      <p>
       See all current reservations, manage events, and view notifications.
      </p>

      {/* Top-row statistic cards */}
      {/* <div className="row my-4">
        <div className="col-12 col-md-6 col-lg-3 mb-4 mb-lg-0">
          <div className="card">
            <h5 className="card-header">Customers</h5>
            <div className="card-body">
              <h5 className="card-title">345k</h5>
              <p className="card-text">Feb 1 – Apr 1, United States</p>
              <p className="card-text text-success">
                18.2% increase since last month
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
          <div className="card">
            <h5 className="card-header">Revenue</h5>
            <div className="card-body">
              <h5 className="card-title">$2.4k</h5>
              <p className="card-text">Feb 1 – Apr 1, United States</p>
              <p className="card-text text-success">
                4.6% increase since last month
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
          <div className="card">
            <h5 className="card-header">Purchases</h5>
            <div className="card-body">
              <h5 className="card-title">43</h5>
              <p className="card-text">Feb 1 – Apr 1, United States</p>
              <p className="card-text text-danger">
                2.6% decrease since last month
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 mb-4 mb-lg-0 col-lg-3">
          <div className="card">
            <h5 className="card-header">Traffic</h5>
            <div className="card-body">
              <h5 className="card-title">64k</h5>
              <p className="card-text">Feb 1 – Apr 1, United States</p>
              <p className="card-text text-success">
                2.5% increase since last month
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* The notifications feed on the right has its height dynamically set to match the calendar on the left using the calCardRef */}
      <AdminPanelContextProvider>
        <div className="row align-items-start">

          <div className="col-12 col-xl-8 mb-4 d-flex flex-column">
            <div
              ref={calCardRef}
              id="calendar-card"
              className="card flex-fill d-flex flex-column"
            >
              <h5 className="card-header">Monthly Overview</h5>
              <div className="card-body flex-fill">
                <DashboardCalendar />
              </div>
            </div>
          </div>

          <AdminCalendarInteractionColumn calHeight={calHeight} />
        </div>
      </AdminPanelContextProvider>
      
    </>
  );
}
