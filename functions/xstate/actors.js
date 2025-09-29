// actors.js - XState v5 Actors (formerly services)
const { fromPromise } = require('xstate');
const { logger } = require('firebase-functions');
const { Timestamp, getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

const db = getFirestore();

// Error categorization helpers
const categorizeError = (error) => {
  if (error.code === 'permission-denied') return 'PERMISSION';
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') return 'NETWORK';
  if (error.code === 'invalid-argument' || error.code === 'failed-precondition') return 'VALIDATION';
  if (error.code === 'not-found') return 'BUSINESS_LOGIC';
  if (error.code === 'already-exists') return 'BUSINESS_LOGIC';
  if (error.message?.includes('quota') || error.message?.includes('limit')) return 'RESOURCE_LIMIT';
  return 'UNKNOWN';
};

const isRetryableError = (error) => {
  const retryableCodes = ['unavailable', 'deadline-exceeded', 'internal', 'aborted'];
  const retryableMessages = ['timeout', 'network', 'connection', 'temporary'];
  
  return retryableCodes.includes(error.code) || 
         retryableMessages.some(msg => error.message?.toLowerCase().includes(msg));
};

// Initialize billing run
const initializeRunActor = fromPromise(async ({ input }) => {
  try {
    const runRef = db.collection('BillingRuns').doc();
    await runRef.set({ status: 'running', startTime: new Date() });
    logger.info('⏳ [BILLING] Created billing run:', { 
      runId: runRef.id, 
      timestamp: new Date().toISOString() 
    });
    
    const resSnaps = await db.collection('Reservations')
      .where('invoice', '==', null)
      .where('status', '==', 'processing')
      .get();
    logger.info('💚 [BILLING] Fetched reservations: ', {runId: runRef.id, reservationsCount: resSnaps.docs.length});
    
    // Fetch user data for all reservations
    const userIds = [...new Set(resSnaps.docs.map(doc => doc.data().User.id))];
    
    const userSnaps = await Promise.all(
      userIds.map(userId => db.collection('Users').doc(userId).get())
    );
    
    const userData = {};
    userSnaps.forEach(snap => {
      if (snap.exists) {
        userData[snap.id] = snap.data();
      }
    });
    
    logger.info(`💚 [BILLING] Fetched user data for: ${Object.keys(userData).length} users`, { userData: Object.keys(userData).map(id => userData[id].Name) });
    
    return { runId: runRef.id, reservations: resSnaps.docs, userData };
  } catch (error) {
    // Properly format the error for XState
    logger.error('❌ [BILLING] Initialize run failed:', error);
    logger.error('❌ [BILLING] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    
    // Categorize error type
    const errorType = categorizeError(error);
    const retryable = isRetryableError(error);
    
    // Enrich error with context
    const enrichedError = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'initializeRunActor',
      operation: 'INITIALIZE_RUN',
      errorType: errorType,
      retryable: retryable,
      context: {
        runId: runRef?.id || 'unknown',
        dryRun: input.dryRun
      }
    };
    
    throw enrichedError;
  }
});

// Fetch overdue invoices
const fetchOverdueInvoicesActor = fromPromise(async ({ input }) => {
  try {
    const snap = await db.collection('Invoices')
      .where('status', '==', 'unpaid')
      .where('dueDate', '<', Timestamp.now())
      .get();
    logger.info('💚 [BILLING] Found newly-overdue invoices:', snap.docs.length);
    return snap.docs;
  } catch (error) {
    logger.error('❌ [BILLING] Fetch newly-overdue invoices failed:', error);
    
    // Categorize error type
    const errorType = categorizeError(error);
    const retryable = isRetryableError(error);
    
    // Enrich error with context
    const enrichedError = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'fetchOverdueInvoicesActor',
      operation: 'FETCH_OVERDUE_INVOICES',
      errorType: errorType,
      retryable: retryable,
      context: {
        dryRun: input.dryRun
      }
    };
    
    throw enrichedError;
  }
});

// Persist invoice
const persistInvoiceActor = fromPromise(async ({ input }) => {
  try {
    const { currentInvoice, dryRun, reservations, resIdx, newInvoices, runId } = input;
    
    if (dryRun) {
      logger.info('👀 [BILLING] DRY-RUN: Would persist invoice:', currentInvoice);
      return;
    }
    
    await db.runTransaction(async (tx) => {
      tx.set(
        db.collection('Invoices').doc(currentInvoice.invoiceId),
        currentInvoice,
        { merge: true }
      );
      tx.update(reservations[resIdx].ref, { 
        invoice: db.collection('Invoices').doc(currentInvoice.invoiceId)
      });
      logger.info('💾 [BILLING] Persisted invoice:', {invoiceId: currentInvoice.invoiceId, reservationId: currentInvoice.reservationId, runId});
    });

    return [`Invoices/${currentInvoice.invoiceId}`, ...newInvoices];
  } catch (error) {
    logger.error('❌ [BILLING] Persist invoice failed:', error);
    
    // Categorize error type
    const errorType = categorizeError(error);
    const retryable = isRetryableError(error);
    
    // Enrich error with context
    const enrichedError = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'persistInvoiceActor',
      operation: 'CREATE_INVOICE',
      errorType: errorType,
      retryable: retryable,
      context: {
        reservationId: currentInvoice.reservationId,
        invoiceId: currentInvoice.invoiceId,
        userId: currentInvoice.user.id,
        runId: runId,
        resIdx: resIdx
      }
    };
    
    throw enrichedError;
  }
});

// Apply late fee
const applyLateFeeActor = fromPromise(async ({ input }) => {
  try {
    const { overdueInvoices, overIdx, dryRun } = input;
    const invSnap = overdueInvoices[overIdx];
    const data = invSnap.data();
    const feeExists = data.lineItems?.some((li) => li.tag === 'LATE_FEE');
    
    if (dryRun) {
      logger.info('👀 [BILLING] DRY-RUN late-fee check', invSnap.id, { feeExists });
      return { userId: data.user.id };
    }
    
    if (!feeExists) {
      const feeLI = {
        tag: 'LATE_FEE',
        service: 'Late fee',
        durationHours: 1,
        rateCentsPerHour: 500,
        subtotalCents: 500
      };

      const newSubtotal = data.subtotalCents + feeLI.subtotalCents;
      const newTax = Math.round(newSubtotal * 0.08);
      await invSnap.ref.update({
        status: 'late',
        lineItems: FieldValue.arrayUnion(feeLI),
        subtotalCents: newSubtotal,
        taxCents: newTax,
        totalCents: newSubtotal + newTax
      });
    } else {
      await invSnap.ref.update({ status: 'late' });
    }
    
    return { userId: data.user.id };
  } catch (error) {
    logger.error('❌ [BILLING] Apply late fee failed:', error);
    
    // Categorize error type
    const errorType = categorizeError(error);
    const retryable = isRetryableError(error);
    
    // Enrich error with context
    const enrichedError = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'applyLateFeeActor',
      operation: 'APPLY_LATE_FEE',
      errorType: errorType,
      retryable: retryable,
      context: {
        invoiceId: invSnap?.id || 'unknown',
        userId: data?.user?.id || 'unknown',
        overIdx: overIdx,
        dryRun: dryRun
      }
    };
    
    throw enrichedError;
  }
});

// Recalculate user hold
const recalcUserHoldActor = fromPromise(async ({ input }) => {
  try {
    const { uid, dryRun } = input;
    if (dryRun) {
      logger.info('👀 [BILLING] DRY-RUN recalc hold', { userId: uid });
      return;
    }
    
    const snap = await db.collection('Invoices')
      .where('user.id', '==', uid)
      .where('status', 'in', ['unpaid', 'late'])
      .get();
    
    const hold = snap.size > 2;
    await db.collection('Users').doc(uid).set({ paymentHold: hold }, { merge: true });
  } catch (error) {
    logger.error('❌ [BILLING] Recalc user hold failed:', error);
    
    // Categorize error type
    const errorType = categorizeError(error);
    const retryable = isRetryableError(error);
    
    // Enrich error with context
    const enrichedError = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'recalcUserHoldActor',
      operation: 'RECALC_USER_HOLD',
      errorType: errorType,
      retryable: retryable,
      context: {
        userId: uid,
        dryRun: dryRun
      }
    };
    
    throw enrichedError;
  }
});

// Wrap up billing run
const wrapUpActor = fromPromise(async ({ input }) => {
  try {
    const { runId, failures, reservations, dryRun, overdueInvoices, newInvoices, finalStatus, hasFailures } = input;

    const reservationsProcessed = reservations.map(res => `Reservations/${res.id}`);
    const overdueInvoicesProcessed = overdueInvoices.map(inv => `Invoices/${inv.id}`);
    const newInvoicesProcessed = newInvoices;

    // Determine the appropriate status based on failures
    const actualStatus = hasFailures ? 'completed_with_problems' : 'success';
    
    logger.info('🏁 [BILLING] Wrapping up billing run:', {
      runId,
      finalStatus: actualStatus,
      failures: failures.length,
      reservationsProcessed,
      overdueInvoicesProcessed,
      newInvoicesProcessed
    });
    
    if (!dryRun) {
      return db.collection('BillingRuns').doc(runId)
        .set({ 
          status: actualStatus, 
          endTime: new Date(), 
          failures, 
          reservations: reservationsProcessed, 
          newOverdueInvoices: overdueInvoicesProcessed, 
          newInvoices: newInvoicesProcessed 
        }, { merge: true });
    }
  } catch (error) {
    logger.error('❌ [BILLING] Wrap up failed - completing run anyway:', {
      error: error.message,
      runId: runId,
      failuresCount: failures.length
    });
    
    // Don't throw - just complete the run even if we can't update the BillingRun document
    return;
  }
});

module.exports = {
  initializeRunActor,
  fetchOverdueInvoicesActor,
  persistInvoiceActor,
  applyLateFeeActor,
  recalcUserHoldActor,
  wrapUpActor
};
