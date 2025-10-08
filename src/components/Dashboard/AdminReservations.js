import React, { useState, useMemo, useEffect } from "react";
import { useAllReservationsRQ } from "../../Hooks/query-related/useAllReservationsRQ";
import { useReservationsByMonthDayRQ } from "../../Hooks/query-related/useReservationsByMonthDayRQ";
import { useAdminPanelContext } from "./AdminPanelContext";
import { useQueryClient } from '@tanstack/react-query';
import { getReservationStatus } from '../../Helpers/util';
import { useAuth } from '../AuthProvider';
import DropOffConfirmationModal from '../Shared/DropOffConfirmationModal';
import PickUpConfirmationModal from '../Shared/PickUpConfirmationModal';

// Helper function to generate visible page numbers for pagination
const generateVisiblePageNumbers = (currentPage, totalPages, maxVisiblePages = 5) => {
  // If we have fewer pages than the maximum visible, show all pages
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // Calculate the range of pages to show, centered around current page
  const halfVisible = Math.floor(maxVisiblePages / 2);
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};



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
  
  // Update the hook's monthYear state when selectedDate changes
  useEffect(() => {
    if (selectedDate && monthReservationsQuery.setMonthYear) {
      monthReservationsQuery.setMonthYear({
        day: selectedDate.getUTCDate(),
        month: selectedDate.getUTCMonth(),
        year: selectedDate.getUTCFullYear(),
      });
    }
  }, [selectedDate, monthReservationsQuery.setMonthYear]);
  
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

  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("start");
  const [sortDirection, setSortDirection] = useState("desc");

  // Helper function to get status from either data format
  const getReservationStatus = (reservation) => {
    // Handle both raw data (extendedProps.status) and transformed data (status)
    return reservation.status || reservation.extendedProps?.status || '--';
  };

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
        const isInRange = reservationDate >= startOfDay && reservationDate <= endOfDay;
        return isInRange;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reservation => 
        reservation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getReservationStatus(reservation).toLowerCase().includes(searchTerm.toLowerCase())
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
          aValue = getReservationStatus(a);
          bValue = getReservationStatus(b);
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

  const queryClient = useQueryClient();
  const { dbService } = useAuth();

  // Modal state
  const [dropOffModal, setDropOffModal] = useState({
    show: false,
    reservationData: null
  });

  const [pickUpModal, setPickUpModal] = useState({
    show: false,
    reservationId: null,
    reservationData: null,
    userData: null,
    costBreakdown: null
  });

  const handleDropOff = (reservation) => {
    setDropOffModal({
      show: true,
      reservationData: reservation
    });
  };

  const handleConfirmDropOff = async (dropOffTimestamp) => {
    try {
      await dbService.dropOffChild(dropOffModal.reservationData.id, dropOffTimestamp, []);
      queryClient.invalidateQueries(['adminAllReservations']);
      setDropOffModal({ show: false, reservationData: null });
    } catch (error) {
      console.error('Error dropping off child:', error);
      throw error;
    }
  };

  const handlePickUp = async (reservationId) => {
    try {
      const reservationData = await dbService.getReservationData(reservationId);
      const userData = await dbService.getUserData(reservationData.userId);
      
      const costBreakdown = await dbService.calculateFinalCheckoutAmount(reservationData);

      setPickUpModal({
        show: true,
        reservationId,
        reservationData,
        userData,
        costBreakdown
      });
    } catch (error) {
      console.error('Error preparing pick-up:', error);
      alert('Failed to prepare pick-up: ' + error.message);
    }
  };

  const handleConfirmPickUp = async (finalAmount, calculatedAmount, overrideReason, selectedActivityId) => {
    try {
      const result = await dbService.pickUpChild(
        pickUpModal.reservationId,
        finalAmount,
        calculatedAmount,
        overrideReason,
        selectedActivityId
      );
      
      if (result.success) {
        queryClient.invalidateQueries(['adminAllReservations']);
        if (!result.noPaymentRequired) {
          alert('Checkout session created. Parent can complete payment from their profile.');
        }
      }
      
      setPickUpModal({
        show: false,
        reservationId: null,
        reservationData: null,
        userData: null,
        costBreakdown: null
      });
    } catch (error) {
      console.error('Error picking up child:', error);
      throw error;
    }
  };

  const renderActionButtons = (reservation) => {
    const status = getReservationStatus(reservation);
    switch (status) {
      case 'confirmed':
        return (
          <button 
            className="btn btn-success btn-sm"
            onClick={() => handleDropOff(reservation)}
          >
            Drop Off
          </button>
        );
      case 'dropped-off':
        return (
          <button 
            className="btn btn-warning btn-sm"
            onClick={() => handlePickUp(reservation.id)}
          >
            Pick Up
          </button>
        );
      case 'picked-up':
        return reservation.dropOffPickUp?.finalCheckoutUrl ? (
          <a 
            href={reservation.dropOffPickUp.finalCheckoutUrl}
            className="btn btn-primary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Complete Payment
          </a>
        ) : (
          <span className="badge bg-secondary">No Payment Required</span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const formatTableRow = (reservation) => {
    return (
      <tr key={reservation.id}>
        <th scope="row">{reservation.title || '--'}</th>
        {!selectedDate && (
          <td>{formatDate(reservation.start)}</td>
        )}
        <td>{formatTime(reservation.start)} - {formatTime(reservation.end)}</td>
        <td>{getReservationStatus(reservation)}</td>
        <td>{renderActionButtons(reservation)}</td>
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
            <div className="card-body d-flex flex-column">
              {/* Search and Sort Controls */}
              <div className="row mb-3 flex-shrink-0">
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

              <div className="table-responsive flex-fill overflow-auto">
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
                        <th scope="col">Actions</th>
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
                <nav aria-label="Appointments pagination" className="mt-3 flex-shrink-0">
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
                    
                    {/* Show page numbers - display up to 5 pages centered around current page */}
                    {generateVisiblePageNumbers(paginationInfo.currentPage, paginationInfo.totalPages).map(pageNum => (
                      <li key={pageNum} className={`page-item ${paginationInfo.currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ))}
                    
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
      
      <DropOffConfirmationModal
        show={dropOffModal.show}
        onHide={() => setDropOffModal({ show: false, reservationData: null })}
        reservationData={dropOffModal.reservationData}
        onConfirmDropOff={handleConfirmDropOff}
      />
      
      <PickUpConfirmationModal
        show={pickUpModal.show}
        onHide={() => setPickUpModal({
          show: false,
          reservationId: null,
          reservationData: null,
          userData: null,
          costBreakdown: null
        })}
        reservationData={pickUpModal.reservationData}
        userData={pickUpModal.userData}
        costBreakdown={pickUpModal.costBreakdown}
        onConfirmPickUp={handleConfirmPickUp}
      />
    </>
  );
}

export default AdminReservations;
