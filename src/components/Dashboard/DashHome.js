import React, { useRef, useState, useEffect, useCallback } from 'react';
import DashboardCalendar from '../Shared/DashboardCalendar';
import AdminCalendarInteractionColumn from './AdminCalendarInteractionColumn';
import { AdminPanelContextProvider } from './AdminPanelContext';
import AdminDashWidget from './AdminDashWidget';

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
      <h1 className="h2">Admin Dashboard</h1>

      {/* Top-row statistic cards */}
      <div className="row my-4">

        <AdminDashWidget 
          title="Customers"
          totalValue="345k"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="18.2"  
        />
        
        <AdminDashWidget
          title="Revenue"
          totalValue="$2.4k"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="4.6"
        />

        <AdminDashWidget
          title="Purchases"
          totalValue="43"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="-2.6"
        />

        <AdminDashWidget
          title="Traffic"
          totalValue="64k"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="2.5"
        />

      </div>

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
