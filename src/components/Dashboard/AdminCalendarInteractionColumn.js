import React from "react";
import AdminDashReservationCard from "./AdminDashReservationCard";

export default function AdminCalendarInteractionColumn({ calHeight }) {
  return (
    <div className="col-12 col-xl-4 mb-4 d-flex flex-column">
          <div
            className="card flex-fill d-flex flex-column"
            style={{ maxHeight: calHeight, minHeight: calHeight }}
          >
            <h5 className="card-header">All Pending Reservations</h5>
            <div
              className="card-body overflow-auto flex-fill"
              style={{ minHeight: 0 }}
            >
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
              <AdminDashReservationCard />
            </div>
          </div>
        </div>
  );
}