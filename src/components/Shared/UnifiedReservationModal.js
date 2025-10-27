import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogTitle, 
  DialogContent 
} from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { checkAgainstBusinessHours, checkFutureStartTime, getCurrentDate, getCurrentTime } from '../../Helpers/calendar';
import { calculateTimeDifference } from '../../Helpers/datetime';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RESERVATION_STATUS, SERVICE_PRICE_LOOKUP_UIDS } from '../../Helpers/constants';
import { useServicePricesRQ } from '../../Hooks/query-related/useServicePricesRQ';

// Step components
import FormStep from './ReservationSteps/FormStep';
import PaymentStep from './ReservationSteps/PaymentStep';
import ProcessingStep from './ReservationSteps/ProcessingStep';
import PaymentSuccessStep from './ReservationSteps/PaymentSuccessStep';
import PaymentFailedStep from './ReservationSteps/PaymentFailedStep';

const UnifiedReservationModal = ({ 
  modalOpenState = false, 
  closeTheModal, 
  children, 
  scheduleChildSitterPage_queryKey,
  initialContext = null
}) => {
  const queryClient = useQueryClient();
  const { currentUser, dbService } = useAuth();
  const { getServicePrice, isLoading: pricesLoading } = useServicePricesRQ();
  
  // Get dynamic pricing from service prices
  const hourlyRate = getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.STANDARD_FEE_FIRST_CHILD_HOURLY)?.pricePerUnitInCents / 100 || 25;
  const additionalChildHourlyRate = getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.STANDARD_FEE_ADDITIONAL_CHILD_HOURLY)?.pricePerUnitInCents / 100 || 7;

  // Unified state management - initialize based on initialContext
  const [state, setState] = useState(() => {
    const baseState = {
      formData: {
        selectedChild: [],
        date: `${getCurrentDate()}`,
        start: `${getCurrentTime()}`,
        end: `${getCurrentTime()}`,
        groupActivity: false
      },
      reservations: [],
      paymentData: {
        totalBill: 0,
        totalTime: 0,
        paymentType: null
      },
      isProcessing: false,
      error: null,
      isFormValid: false
    };

    if (initialContext === 'payment_success') {
      return { ...baseState, currentStep: 'payment_success' };
    } else if (initialContext === 'payment_failed') {
      return { ...baseState, currentStep: 'payment_failed' };
    } else {
      return { ...baseState, currentStep: 'form' };
    }
  });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Add validation callback
  const handleValidationChange = useCallback((isValid) => {
    updateState({ isFormValid: isValid });
  }, [updateState]);


  // Handle initial context and load form draft when needed
  useEffect(() => {
    if (initialContext === 'payment_success') {
      // Backend webhook handles form draft deletion
      // Just show success step
      updateState({ currentStep: 'payment_success' });
    } else if (initialContext === 'payment_failed') {
      // Form draft should already be loaded by useEffect when initialStep === 'payment_failed'
      updateState({
        currentStep: 'payment_failed',
        reservations: [] // Clear any existing reservations
      });
      // Load form draft for payment failure recovery
      if (modalOpenState) {
        loadFormDraft();
      }
    }
  }, [initialContext, modalOpenState]);

  const loadFormDraft = async () => {
    try {
      const draft = await dbService.getFormDraft(currentUser.uid);
      if (draft) {
        updateState({
          currentStep: 'payment_failed', // Always show payment failed step when loading draft
          formData: draft.formData,
          reservations: draft.paymentStepData?.reservations || [],
          paymentData: {
            totalBill: draft.paymentStepData?.totalBill || 0,
            totalTime: draft.paymentStepData?.totalTime || 0,
            paymentType: null
          }
        });
      }
    } catch (error) {
      if (error.code !== 'not-found') {
        console.error('Error loading form draft:', error);
      }
      // If we can't load the draft, just show the payment failed step
      updateState({ currentStep: 'payment_failed' });
    }
  };

  const saveFormDraft = async (formData, reservations, paymentStepData) => {
    const draft = {
      archived: false,
      formData,
      reservations: reservations.map(ref => ({ id: ref.id, path: ref.path })),
      paymentStepData: {
        reservations: paymentStepData.reservations, // The processed reservation objects for PaymentStep
        totalBill: paymentStepData.totalBill,
        totalTime: paymentStepData.totalTime
      },
      status: 'draft',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000), // 1 minute
      paymentAttempts: 0
    };
    
    // Use Cloud Function to upsert the form draft (bypasses security rules)
    const response = await fetch(`${process.env.LATERTOTS_APP_FIREBASE_FUNCTION_URL}/upsertFormDraft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.uid,
        draftData: draft
      }),
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to save form draft');
    }
  };


  // Group activity change handler - simplified to update reservation directly
  const handleGroupActivityChange = (stableId, isSelected) => {
    setState(prev => ({
      ...prev,
      // Update the actual reservation's groupActivity field directly
      reservations: prev.reservations.map(reservation => 
        reservation.stableId === stableId 
          ? { ...reservation, groupActivity: isSelected }
          : reservation
      )
    }));
  };

  // Form submission
  const handleFormSubmit = async (formData) => {
    // Safety check to ensure selectedChild is defined and is an array
    if (!formData.selectedChild || !Array.isArray(formData.selectedChild)) {
      console.error('selectedChild is not defined or not an array:', formData.selectedChild);
      return;
    }
    
    const newEvents = formData.selectedChild.map((child, index) => {
      return {
        stableId: `${child.id}-${index}`, // Create stable identifier
        title: child.name,
        childId: child.id, // FIXED: Add childId field for backend processing
        start: new Date(formData.date + 'T' + formData.start).toISOString(),
        end: new Date(formData.date + 'T' + formData.end).toISOString(),
        groupActivity: formData.groupActivity,
        // Note: extendedProps removed - fields handled at top level in backend
        totalTime: calculateTimeDifference(formData.start, formData.end)
      };
    });

    // Validate business hours and overlap
    const validHours = newEvents.every((event) => {
      return checkAgainstBusinessHours(event) && checkFutureStartTime(event);
    });
    if (!validHours) {
      updateState({ error: 'One or more reservations falls outside of valid business hours. Please check the date/time and try again.' });
      return;
    }

    const validOverlap = await dbService.checkReservationOverlapLimit(newEvents);
    if (!validOverlap) {
      updateState({ error: 'No more than 5 reservations can take place simultaneously. Please check available time slots and try again.' });
      return;
    }

    const totalTime = newEvents.reduce((sum, event) => sum + parseFloat(event.totalTime), 0);
    const totalBill = newEvents.reduce((sum, event, index) => {
      const rate = index === 0 ? hourlyRate : additionalChildHourlyRate;
      return sum + (event.totalTime * rate);
    }, 0);

    updateState({
      currentStep: 'payment',
      reservations: newEvents,
      paymentData: { totalBill, totalTime, paymentType: null },
      error: null
    });
  };

  // Payment submission
  const handlePaymentSubmit = async (paymentType) => {
    updateState({ 
      currentStep: 'processing', 
      isProcessing: true,
      error: null 
    });
    try {
      // Create optimistic reservations
      const reservationRefs = await dbService.createReservationsBatch(
        currentUser.uid, 
        state.reservations, 
        currentUser.uid // formDraftId
      );
      
      // Update reservations with document UIDs for PaymentStep
      const reservationsWithUids = state.reservations.map((reservation, index) => ({
        ...reservation,
        documentId: reservationRefs[index].id
      }));

      // Update state with reservations that have document UIDs
      updateState({ reservations: reservationsWithUids });

      // Save form draft with payment step data
      await saveFormDraft(state.formData, reservationRefs, {
        reservations: state.reservations,
        totalBill: state.paymentData.totalBill,
        totalTime: state.paymentData.totalTime
      });
      
      // Create checkout session
      const stripePayload = {
        reservations: reservationRefs.map((ref, index) => {
          const reservation = state.reservations[index];
          
          // Calculate the rate for this reservation (first child gets standard rate, others get additional rate)
          const hourlyRateCents = index === 0 ? (hourlyRate * 100) : (additionalChildHourlyRate * 100);
          
          return {
            reservationId: ref.id,
            childName: reservation.title,
            durationHours: reservation.totalTime,
            hourlyRateCents: hourlyRateCents, // Dynamic pricing from frontend service prices
            groupActivity: reservation.groupActivity // Direct usage - no override logic needed
          };
        }),
        paymentType,
        latertotsUserId: currentUser.uid,
        successUrl: `${window.location.origin}/schedule?payment=success`,
        cancelUrl: `${window.location.origin}/schedule?payment=failed`
      };
      
      const response = await fetch(`${process.env.LATERTOTS_APP_FIREBASE_FUNCTION_URL}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripePayload),
      });
      const session = await response.json();
      
      if (session.success) {
        window.location.href = session.url;
      } else {
        throw new Error(session.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      updateState({
        currentStep: 'payment_failed',
        isProcessing: false,
        error: error.message
      });
    }
  };


  // Handle retry
  const handleRetry = () => {
    updateState({ currentStep: 'payment' });
  };

  // Handle edit details
  const handleEditDetails = () => {
    updateState({ currentStep: 'form' });
  };

  // Handle cancel
  const handleCancel = async () => {
    closeTheModal();

    try {
      const cleanupFunction = httpsCallable(functions, 'cleanupFailedReservationsManual');
      await cleanupFunction();
    } catch (error) {
      console.warn('[e93944e9] An error occurred');
    }
    
    updateState({
      currentStep: 'form',
      formData: {
        selectedChild: [],
        date: `${getCurrentDate()}`,
        start: `${getCurrentTime()}`,
        end: `${getCurrentTime()}`,
        groupActivity: false
      },
      reservations: [],
      error: null
    });
  };

  // Handle close
  const handleClose = () => {
    updateState({
      currentStep: 'form',
      formData: {
        selectedChild: [],
        date: `${getCurrentDate()}`,
        start: `${getCurrentTime()}`,
        end: `${getCurrentTime()}`,
        groupActivity: false
      },
      reservations: [],
      error: null
    });
    closeTheModal();
  };

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
        case 'form':
          return (
            <FormStep
              formData={state.formData}
              setFormData={(formData) => updateState({ formData })}
              children={children}
              onSubmit={handleFormSubmit}
              onValidationChange={handleValidationChange}
            />
          );
      case 'payment':
        return (
          <PaymentStep
            reservations={state.reservations}
            hourlyRate={hourlyRate}
            additionalChildHourlyRate={additionalChildHourlyRate}
            grandTotalTime={state.paymentData.totalTime}
            grandTotalBill={state.paymentData.totalBill}
            onGroupActivityChange={handleGroupActivityChange}
            onPaymentTypeSelect={handlePaymentSubmit}
            onEditDetails={handleEditDetails}
            isProcessingPayment={state.isProcessing}
            error={state.error}
          />
        );
      case 'processing':
        return (
          <ProcessingStep
            isProcessing={state.isProcessing}
            error={state.error}
          />
        );
      case 'payment_success':
        return <PaymentSuccessStep onClose={handleClose} />;
      case 'payment_failed':
        return (
          <PaymentFailedStep
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        );
      default:
        return (
          <FormStep
            formData={state.formData}
            setFormData={(formData) => updateState({ formData })}
            children={children}
            onSubmit={handleFormSubmit}
            onValidationChange={handleValidationChange}
          />
        );
    }
  };


  return (
    <Dialog open={modalOpenState} aria-labelledby="form-dialog-title" maxWidth="md" fullWidth>
      <DialogTitle id="form-dialog-title">
        {state.currentStep === 'form' && 'New Reservation'}
        {state.currentStep === 'payment' && 'Payment Summary'}
        {state.currentStep === 'processing' && 'Processing...'}
        {state.currentStep === 'payment_success' && 'Payment Successful'}
        {state.currentStep === 'payment_failed' && 'Payment Failed'}
      </DialogTitle>
      <DialogContent>
        {pricesLoading ? (
          <div>Loading pricing information...</div>
        ) : (
          renderStep()
        )}
      </DialogContent>
      <DialogActions>
        {state.currentStep === 'form' && (
          <>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={() => handleFormSubmit(state.formData)} 
              color="primary" 
              variant="contained"
              disabled={!state.isFormValid}
            >
              Continue to Payment
            </Button>
          </>
        )}
        {state.currentStep === 'payment' && (
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedReservationModal;
