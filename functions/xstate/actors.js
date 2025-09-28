// actors.js - XState v5 Actors (formerly services)
const { fromPromise } = require('xstate');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Initialize billing run
const initializeRunActor = fromPromise(async ({ input }) => {
  try {
    logger.info('🔧 [BILLING] Initializing billing run...');
    logger.info('🔧 [BILLING] Actor input received:', input);
    
    logger.info('🔧 [BILLING] Creating billing run document...');
    const runRef = db.collection('BillingRuns').doc();
    await runRef.set({ status: 'running', startTime: new Date() });
    logger.info('🔧 [BILLING] Created billing run:', { 
      runId: runRef.id, 
      timestamp: new Date().toISOString() 
    });
    
    logger.info('🔧 [BILLING] Querying reservations...');
    const resSnaps = await db.collection('Reservations')
      .where('invoice', '==', null)
      .where('status', '==', 'processing')
      .get();
    logger.info('🔧 [BILLING] Found reservations:', resSnaps.docs.length);
    
    const result = { runId: runRef.id, reservations: resSnaps.docs };
    logger.info('🔧 [BILLING] Actor returning result:', { 
      runId: result.runId, 
      reservationCount: result.reservations.length 
    });
    
    return result;
  } catch (error) {
    // Properly format the error for XState
    logger.error('🔧 [BILLING] Initialize run failed:', error);
    logger.error('🔧 [BILLING] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'initializeRunActor'
    };
  }
});

// Fetch overdue invoices
const fetchOverdueInvoicesActor = fromPromise(async ({ input }) => {
  try {
    logger.info('🔧 [BILLING] Fetching overdue invoices...');
    const snap = await db.collection('Invoices')
      .where('status', '==', 'unpaid')
      .where('dueDate', '<', admin.firestore.Timestamp.now())
      .get();
    logger.info('🔧 [BILLING] Found overdue invoices:', snap.docs.length);
    return snap.docs;
  } catch (error) {
    logger.error('🔧 [BILLING] Fetch overdue invoices failed:', error);
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'fetchOverdueInvoicesActor'
    };
  }
});

// Persist invoice
const persistInvoiceActor = fromPromise(async ({ input }) => {
  try {
    const { currentInvoice, dryRun, reservations, resIdx } = input;
    logger.info(`💾 [BILLING] Persisting invoice ${currentInvoice.invoiceId} for reservation ${currentInvoice.reservationId}`);
    
    if (dryRun) {
      logger.info('🔍 [BILLING] DRY-RUN: Would persist invoice:', currentInvoice);
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
    });
  } catch (error) {
    logger.error('🔧 [BILLING] Persist invoice failed:', error);
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'persistInvoiceActor'
    };
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
      logger.info('🔍 [BILLING] DRY-RUN late-fee check', invSnap.id, { feeExists });
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
        lineItems: admin.firestore.FieldValue.arrayUnion(feeLI),
        subtotalCents: newSubtotal,
        taxCents: newTax,
        totalCents: newSubtotal + newTax
      });
    } else {
      await invSnap.ref.update({ status: 'late' });
    }
    
    return { userId: data.user.id };
  } catch (error) {
    logger.error('🔧 [BILLING] Apply late fee failed:', error);
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'applyLateFeeActor'
    };
  }
});

// Recalculate user hold
const recalcUserHoldActor = fromPromise(async ({ input }) => {
  try {
    const { uid, dryRun } = input;
    if (dryRun) {
      logger.info('🔍 [BILLING] DRY-RUN recalc hold', uid);
      return;
    }
    
    const snap = await db.collection('Invoices')
      .where('user.id', '==', uid)
      .where('status', 'in', ['unpaid', 'late'])
      .get();
    
    const hold = snap.size > 2;
    await db.collection('Users').doc(uid).set({ paymentHold: hold }, { merge: true });
  } catch (error) {
    logger.error('🔧 [BILLING] Recalc user hold failed:', error);
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'recalcUserHoldActor'
    };
  }
});

// Wrap up billing run
const wrapUpActor = fromPromise(async ({ input }) => {
  try {
    const { runId, failures, reservations, dryRun } = input;
    logger.info('🏁 [BILLING] Wrapping up billing run:', {
      runId,
      failures: failures.length,
      reservationsProcessed: reservations.length
    });
    
    if (!dryRun) {
      return db.collection('BillingRuns').doc(runId)
        .set({ status: 'success', endTime: new Date(), failures }, { merge: true });
    }
  } catch (error) {
    logger.error('🔧 [BILLING] Wrap up failed:', error);
    throw {
      message: error.message,
      code: error.code,
      stack: error.stack,
      actor: 'wrapUpActor'
    };
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
