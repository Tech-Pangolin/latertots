import React, { useRef, useState, useEffect, useCallback } from 'react';
import DashboardCalendar from '../Shared/DashboardCalendar';
import AdminCalendarInteractionColumn from './AdminCalendarInteractionColumn';
import { AdminPanelContextProvider } from './AdminPanelContext';
import AdminDashWidget from './AdminDashWidget';
import { FirebaseDbService } from '../../Helpers/firebase';
import { useAuth } from '../AuthProvider';
import { monthNumberToDisplayName } from '../../Helpers/calendar';

export default function DashHome() {
  const { currentUser } = useAuth();
  const [dbService, setDbService] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [reservationsWidgetData, setReservationsWidgetData] = useState(null);

  useEffect(() => {
    setDbService(new FirebaseDbService(currentUser));
  }, [currentUser]);

  // Fetch data for widgets
  useEffect(() => {
    if (!dbService) return;

    dbService.getTotalUsers().then((total) => setTotalUsers(total));

    const date = new Date();
    let thisMonthTotal = [];
    let lastMonthTotal = [];
    const monthName = monthNumberToDisplayName(date.getMonth());

    Promise.all([
      dbService.fetchAllReservationsByMonthDay(date.getFullYear(), date.getMonth()),
      dbService.fetchAllReservationsByMonthDay(date.getFullYear(), date.getMonth() - 1)
    ])
    .then(([thisMonthData, lastMonthData]) => {
      thisMonthTotal = thisMonthData;
      lastMonthTotal = lastMonthData;
      const percentageChange = ((thisMonthTotal.length - lastMonthTotal.length) / lastMonthTotal.length * 100).toFixed(1);
      setReservationsWidgetData({
        thisMonthTotal,
        lastMonthTotal,
        monthName,
        percentageChange,
      });
    })

  }, [dbService]);


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
          title="Homepage Views (example)"
          totalValue="64k"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="2.5"
        />

        <AdminDashWidget
          title="Total Users"
          totalValue={totalUsers ? totalUsers : "Loading..."}
          dateRange="All Time"
        // percentageChange="18.2"  
        />

        <AdminDashWidget
          title="Reservations"
          totalValue={reservationsWidgetData ? reservationsWidgetData.thisMonthTotal.length : "Loading..."}
          dateRange={`${reservationsWidgetData ? reservationsWidgetData.monthName : 'Jan'} 1 - Now`}
          percentageChange={reservationsWidgetData?.percentageChange ? reservationsWidgetData.percentageChange : "Loading..."}
        />

        <AdminDashWidget
          title="Unpaid Invoices (example)"
          totalValue="43"
          dateRange="Feb 1 - Apr 1, United States"
          percentageChange="-2.6"
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
