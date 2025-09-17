import React, { useState, useMemo } from "react";
import { useAllReservationsRQ } from "../../Hooks/query-related/useAllReservationsRQ";
import { useReservationsByMonthDayRQ } from "../../Hooks/query-related/useReservationsByMonthDayRQ";
import { useAdminPanelContext } from "./AdminPanelContext";

const AdminReservations = ({ selectedDate = null, showReturnButton = false, onReturnToMonth = null }) => {
  // Use conditional hook calls based on context
  const isDayView = selectedDate !== null;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  
  const allReservationsQuery = useAllReservationsRQ({ 
    enabled: !isDayView, 
    page: currentPage, 
    pageSize 
  });
  const monthReservationsQuery = useReservationsByMonthDayRQ({ enabled: isDayView });
  
  // Use the appropriate query result
  const queryResult = isDayView ? monthReservationsQuery : allReservationsQuery;
  
  // Extract data based on query type
  const reservations = queryResult.data || [];
  const isLoading = queryResult.isLoading;
  const isError = queryResult.isError;
  
  // Extract pagination info for admin view
  const paginationInfo = isDayView ? null : {
    totalCount: allReservationsQuery.totalCount,
    totalPages: allReservationsQuery.totalPages,
    currentPage: allReservationsQuery.currentPage,
    hasNextPage: allReservationsQuery.hasNextPage,
    hasPreviousPage: allReservationsQuery.hasPreviousPage,
    goToPage: (newPage) => {
      setCurrentPage(newPage);
    }
  };

  // Calculate the range of items being displayed
  const getItemRange = () => {
    if (isDayView) {
      return { start: 1, end: filteredReservations.length, total: filteredReservations.length };
    }
    
    if (paginationInfo) {
      const start = (paginationInfo.currentPage - 1) * pageSize + 1;
      const end = Math.min(paginationInfo.currentPage * pageSize, paginationInfo.totalCount);
      return { start, end, total: paginationInfo.totalCount };
    }
    
    return { start: 1, end: displayReservations.length, total: displayReservations.length };
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("start");
  const [sortDirection, setSortDirection] = useState("desc");

  // Filter reservations by selected date if provided
  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    
    // Filter by date if selectedDate is provided
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.start?.seconds ? reservation.start.toDate() : reservation.start);
        return reservationDate >= startOfDay && reservationDate <= endOfDay;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reservation => 
        reservation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.extendedProps?.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort the results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "start":
          aValue = new Date(a.start?.seconds ? a.start.toDate() : a.start);
          bValue = new Date(b.start?.seconds ? b.start.toDate() : b.start);
          break;
        case "title":
          aValue = a.title || "";
          bValue = b.title || "";
          break;
        case "status":
          aValue = a.extendedProps?.status || "";
          bValue = b.extendedProps?.status || "";
          break;
        default:
          aValue = a[sortField] || "";
          bValue = b[sortField] || "";
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [reservations, selectedDate, searchTerm, sortField, sortDirection]);

  // For now, use filteredReservations directly (pagination will be handled by the hook)
  const displayReservations = filteredReservations;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.seconds ? new Date(timestamp.toDate()) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--';
    const date = timestamp.seconds ? new Date(timestamp.toDate()) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTableRow = (reservation) => {
    return (
      <tr key={reservation.id}>
        <th scope="row">{reservation.title || '--'}</th>
        <td>{formatDate(reservation.start)}</td>
        <td>{formatTime(reservation.start)} - {formatTime(reservation.end)}</td>
        <td>{reservation.extendedProps?.status || '--'}</td>
        <td>{reservation.extendedProps?.childId || '--'}</td>
        <td>{reservation.userId || '--'}</td>
      </tr>
    )
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const cardTitle = selectedDate 
    ? `Appointments for ${formatDate(selectedDate)}`
    : "All Appointments";

  return (
    <>
      <div className="row">
        <div className="col-12 mb-4 mb-lg-0">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{cardTitle}</h5>
              {showReturnButton && onReturnToMonth && (
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onReturnToMonth}
                >
                  Return to Month View
                </button>
              )}
            </div>
            <div className="card-body">
              {/* Search and Sort Controls */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <small className="text-muted">
                    {(() => {
                      const range = getItemRange();
                      if (isDayView) {
                        return `Showing ${range.start}-${range.end} of ${range.total} appointments for this day`;
                      } else if (paginationInfo) {
                        return `Showing ${range.start}-${range.end} of ${range.total} appointments (Page ${paginationInfo.currentPage} of ${paginationInfo.totalPages})`;
                      } else {
                        return `Showing ${range.start}-${range.end} of ${range.total} appointments`;
                      }
                    })()}
                  </small>
                </div>
              </div>

              <div className="table-responsive">
                {isLoading && <p>Loading...</p>}
                {!isLoading && !isError && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th 
                          scope="col" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('title')}
                        >
                          Name {getSortIcon('title')}
                        </th>
                        {!selectedDate && (
                          <th 
                            scope="col" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('start')}
                          >
                            Date {getSortIcon('start')}
                          </th>
                        )}
                        <th scope="col">Time</th>
                        <th 
                          scope="col" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('status')}
                        >
                          Status {getSortIcon('status')}
                        </th>
                        <th scope="col">Child ID</th>
                        <th scope="col">User ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayReservations && displayReservations.map((reservation) => formatTableRow(reservation))}
                    </tbody>
                  </table>
                )}
                {!isLoading && isError && <p>Error loading appointments.</p>}
                {!isLoading && !isError && filteredReservations.length === 0 && (
                  <p>No appointments found.</p>
                )}
              </div>
              
              {/* Pagination controls (only for full admin view) */}
              {!isDayView && paginationInfo && paginationInfo.totalPages > 1 && (
                <nav aria-label="Appointments pagination" className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${!paginationInfo.hasPreviousPage ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(paginationInfo.currentPage - 1)}
                        disabled={!paginationInfo.hasPreviousPage}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(paginationInfo.totalPages - 4, paginationInfo.currentPage - 2)) + i;
                      if (pageNum > paginationInfo.totalPages) return null;
                      
                      return (
                        <li key={pageNum} className={`page-item ${paginationInfo.currentPage === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${!paginationInfo.hasNextPage ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(paginationInfo.currentPage + 1)}
                        disabled={!paginationInfo.hasNextPage}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminReservations;
