import React from "react";
import InteractionColumnNavHeader from "./InteractionColumnNavHeader";
import { useAdminPanelContext } from "./AdminPanelContext";
import AdminDashNotificationsFeed from "./AdminDashNotificationsFeed";
import ManageReservationsPage from "./ManageReservationsPage";

export default function AdminCalendarInteractionColumn({ calHeight }) {
  const { interactionColumnMode, selectedDate, setSelectedDate } = useAdminPanelContext();

  return (
    <div className="col-12 col-xl-4 mb-4 d-flex flex-column">
      <div
        className="card flex-fill d-flex flex-column"
        style={{ maxHeight: calHeight, minHeight: calHeight }}
      >
        <InteractionColumnNavHeader>
          {interactionColumnMode === 'notifications' ? <AdminDashNotificationsFeed /> : <ManageReservationsPage initialDateValue={selectedDate} contextDateSetter={setSelectedDate} />}
          
        </InteractionColumnNavHeader>
      </div>
    </div>
  );
}