// billingServices.js - Service implementations for the billing machine
const admin = require('firebase-admin');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('../constants');

const db = admin.firestore();

// Helper functions
const fetchAllReservationsSnap = async () => {
  return await db.collection('Reservations')
    .where('invoice', '==', null)                           // Not yet billed
    .where('status', '==', RESERVATION_STATUS.PROCESSING)  // Ready for billing
    .get();
}

const fetchAllOverdueInvoicesSnap = async () => {
  return await db.collection('Invoices')
    .where('status', '==', INVOICE_STATUS.UNPAID)
    .where('dueDate', '<', admin.firestore.Timestamp.now())
    .get();
}

const fetchUnpaidInvoicesSnapByUser = async (uid) => {
  return await db.collection('Invoices')
    .where('user.id', '==', uid)
    .where('status', 'in', [INVOICE_STATUS.UNPAID, INVOICE_STATUS.LATE])
    .get();
}

// Service implementations
const billingServices = {
  initializeRunService: async () => {
    console.log('🔧 [BILLING] Initializing billing run...');
    const runRef = db.collection('BillingRuns').doc();
    await runRef.set({ status: 'running', startTime: new Date() });
    console.log('🔧 [BILLING] Created billing run:', runRef.id);
    
    const resSnaps = await fetchAllReservationsSnap();
    console.log('🔧 [BILLING] Found reservations:', resSnaps.docs.length);
    
    return { runId: runRef.id, reservations: resSnaps.docs };
  },

  fetchOverdueInvoicesService: async () => {
    console.log('🔧 [BILLING] Fetching overdue invoices...');
    const snap = await fetchAllOverdueInvoicesSnap();
    console.log('🔧 [BILLING] Found overdue invoices:', snap.docs.length);
    return snap.docs;
  },

  persistInvoiceService: async (ctx) => {
    console.log(`💾 [BILLING] Persisting invoice ${ctx.currentInvoice.invoiceId} for reservation ${ctx.currentInvoice.reservationId}`);
    if (ctx.dryRun) {
      console.log('🔍 [BILLING] DRY-RUN: Would persist invoice:', ctx.currentInvoice);
      return;
    }
    await db.runTransaction(async (tx) => {
      tx.set(
        db.collection('Invoices').doc(ctx.currentInvoice.invoiceId),
        ctx.currentInvoice,
        { merge: true }
      );
      tx.update(ctx.reservations[ctx.resIdx].ref, { 
        invoice: db.collection('Invoices').doc(ctx.currentInvoice.invoiceId)
      });
    });
  },
  
  applyLateFeeService: async (ctx) => {
    const invSnap = ctx.overdueInvoices[ctx.overIdx];
    const data = invSnap.data();

    const feeExists = data.lineItems?.some((li) => li.tag === 'LATE_FEE');
    if (ctx.dryRun) {
      console.log('🔍 [BILLING] DRY-RUN late-fee check', invSnap.id, { feeExists });
      return { userId: data.user.id };
    }

    if (!feeExists) {
      const feeLI = {
        tag: 'LATE_FEE',
        service: 'Late fee',
        durationHours: 1,
        rateCentsPerHour: 500, // $5.00 late fee
        subtotalCents: 500
      };

      const newSubtotal = data.subtotalCents + feeLI.subtotalCents;
      const newTax      = Math.round(newSubtotal * 0.08); // 8% tax
      await invSnap.ref.update({
        status: INVOICE_STATUS.LATE,
        lineItems: admin.firestore.FieldValue.arrayUnion(feeLI),
        subtotalCents: newSubtotal,
        taxCents: newTax,
        totalCents: newSubtotal + newTax
      });
    } else {
      await invSnap.ref.update({ status: INVOICE_STATUS.LATE });
    }
    return { userId: data.user.id };
  },

  recalcUserHoldService: async (ctx) => {
    const uid = ctx.affectedUserId;
    if (ctx.dryRun) {
      console.log('🔍 [BILLING] DRY-RUN recalc hold', uid);
      return;
    }
    const snap = await fetchUnpaidInvoicesSnapByUser(uid);
    const hold = snap.size > 2; // Max 2 unpaid invoices
    await db.collection('Users').doc(uid).set({ paymentHold: hold }, { merge: true });
  },

  wrapUpService: async (ctx) => {
    console.log('🏁 [BILLING] Wrapping up billing run:', {
      runId: ctx.runId,
      failures: ctx.failures.length,
      reservationsProcessed: ctx.reservations.length
    });
    return db.collection('BillingRuns').doc(ctx.runId)
      .set({ status: 'success', endTime: new Date(), failures: ctx.failures }, { merge: true });
  }
};

module.exports = { billingServices };
