import React, { useState, useEffect, useCallback } from 'react';
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
import { MIN_RESERVATION_DURATION_MS, RESERVATION_STATUS, SERVICE_PRICE_LOOKUP_UIDS } from '../../Helpers/constants';
import useDebouncedValidateField from '../../Hooks/useDebouncedValidateField';
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
  const hourlyRate = getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.STANDARD_FEE_FIRST_CHILD_HOURLY)?.pricePerUnitInCents / 100 || 0;
  const additionalChildHourlyRate = getServicePrice(SERVICE_PRICE_LOOKUP_UIDS.STANDARD_FEE_ADDITIONAL_CHILD_HOURLY)?.pricePerUnitInCents / 100 || 0;

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
      errors: {
        start: '',
        end: '',
        date: '',
        selectedChild: ''
      },
      isProcessing: false,
      error: null
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

  // Form validation
  const debouncedValidateFieldFxn = useDebouncedValidateField((data, field) => {
    const errors = {};
    if (!data.selectedChild?.length) {
      errors.selectedChild = 'At least one child must be selected.';
    }
    const start = new Date(`${data.date}T${data.start}`);
    const now = new Date();
    if (field === 'start' && start <= now) {
      errors.start = 'Dropoff time must be in the future.';
    }
    if (field === 'end') {
      const end = new Date(`${data.date}T${data.end}`);
      if (end - start < MIN_RESERVATION_DURATION_MS) {
        errors.end = 'Pickup time must be at least 2 hours after dropoff time.';
      }
    }
    if (field === 'date') {
      const selectedDate = new Date(`${data.date}T00:00:00`);
      const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
      if (selectedDate < today) {
        errors.date = 'Date must be today or in the future.';
      }
    }
    return errors;
  }, (errors) => updateState({ errors }), 500);

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
    const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/latertots-a6694/us-central1/upsertFormDraft`, {
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


  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const newEvents = state.formData.selectedChild.map(child => {
      return {
        id: uuidv4().replace(/-/g, ''),
        title: child.name,
        start: new Date(state.formData.date + 'T' + state.formData.start).toISOString(),
        end: new Date(state.formData.date + 'T' + state.formData.end).toISOString(),
        groupActivity: state.formData.groupActivity,
        extendedProps: {
          status: 'pending',
          childId: child.id
        },
        totalTime: calculateTimeDifference(state.formData.start, state.formData.end)
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

    const validOverlap = dbService.checkReservationOverlapLimit(newEvents);
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
    console.info('[handlePaymentSubmit] Payment type:', paymentType);
    
    try {
      // Create optimistic reservations
      const reservationRefs = await dbService.createReservationsBatch(
        currentUser.uid, 
        state.reservations, 
        currentUser.uid // formDraftId
      );
      console.info('[handlePaymentSubmit] Reservation refs:', reservationRefs);
      
      // Save form draft with payment step data
      await saveFormDraft(state.formData, reservationRefs, {
        reservations: state.reservations,
        totalBill: state.paymentData.totalBill,
        totalTime: state.paymentData.totalTime
      });
      console.info('[handlePaymentSubmit] Form draft saved');
      // Create checkout session
      const stripePayload = {
        reservations: reservationRefs.map((ref, index) => ({
          reservationId: ref.id,
          childName: state.reservations[index].title,
          durationHours: state.reservations[index].totalTime,
          groupActivity: state.reservations[index].groupActivity
        })),
        paymentType,
        latertotsUserId: currentUser.uid,
        successUrl: `${window.location.origin}/schedule?payment=success`,
        cancelUrl: `${window.location.origin}/schedule?payment=failed`
      };
      
      const response = await fetch(`${process.env.REACT_APP_FIREBASE_FUNCTION_URL}/latertots-a6694/us-central1/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripePayload),
      });
      console.info('[handlePaymentSubmit] Checkout session created');
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
            errors={state.errors}
            children={children}
            onFieldChange={debouncedValidateFieldFxn}
            onValidation={() => {}}
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
            errors={state.errors}
            children={children}
            onFieldChange={debouncedValidateFieldFxn}
            onValidation={() => {}}
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
            <Button onClick={handleFormSubmit} color="primary" variant="contained">
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
