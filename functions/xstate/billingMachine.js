// billingMachine.js - Pure state machine definition
const { createMachine, assign } = require('xstate');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('../constants');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');

const db = admin.firestore();

/*──────────────── helpers ────────────────*/
function convertToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/*──────────────── state machine ──────────*/
const billingMachine = createMachine(
  {
    id: 'dailyBillingJob',
    initial: 'initializeRun',
    predictableActionArguments: true,

    context: {
      runId: '',
      reservations: [],
      resIdx: 0,
      currentInvoice: undefined,
      overdueInvoices: [],
      overIdx: 0,
      failures: [],
      dryRun: process.env.DRY_RUN === 'true'
    },

    /*───────────── states ───────────*/
    states: {
      /* 0 ─ initialize & preload reservations */
      initializeRun: {
        entry: () => logger.info('🚀 [BILLING] Starting billing run initialization...'),
        invoke: {
          src: 'initializeRunService'
        },
        onDone: {
          target: 'nextReservation',
          actions: 'storeInitData'
        },
        onError: 'fatalError'
      },

      /* PASS A : reservations → invoices */
      nextReservation: {
        entry: (ctx) => logger.info(`🔍 [BILLING] Checking reservation ${ctx.resIdx + 1}/${ctx.reservations.length}`),
        always: [
          { 
            cond: (ctx) => {
              const isComplete = ctx.resIdx >= ctx.reservations.length;
              if (isComplete) logger.info('✅ [BILLING] All reservations processed, moving to overdue invoices');
              return isComplete;
            }, 
            target: 'completeReservationPass' 
          },
          { 
            target: 'calculateCharges',
            actions: (ctx) => logger.info(`💰 [BILLING] Processing reservation ${ctx.resIdx + 1}: ${ctx.reservations[ctx.resIdx]?.id}`)
          }
        ]
      },

      calculateCharges: {
        entry: assign((ctx) => {
          const snap = ctx.reservations[ctx.resIdx];
          const snapData = snap.data();
          const start = snapData.start.toDate();
          const end = snapData.end.toDate();
          
          logger.info(`🧮 [BILLING] Calculating charges for reservation ${snap.id}:`, {
            start: start.toISOString(),
            end: end.toISOString(),
            duration: `${((end - start) / (1000 * 60 * 60)).toFixed(2)} hours`
          });

          const billableMins = Math.max(60, // minimum 1 hour
            Math.min(480, // max 8 hours
              convertToMinutes(end) - convertToMinutes(start)
            )
          );
          const billableHours = billableMins / 60;

          const baseSubtotal = Math.round(billableHours * 2000); // $20/hour
          const lateAddon = billableHours > 4 ? 500 : 0; // $5 late fee if over 4 hours
          const subtotal  = baseSubtotal + lateAddon;
          const tax       = Math.round(subtotal * 0.08); // 8% tax
          const total     = subtotal + tax;

          logger.info(`💵 [BILLING] Invoice calculation:`, {
            billableHours: billableHours.toFixed(2),
            baseSubtotal: `$${(baseSubtotal / 100).toFixed(2)}`,
            lateAddon: `$${(lateAddon / 100).toFixed(2)}`,
            subtotal: `$${(subtotal / 100).toFixed(2)}`,
            tax: `$${(tax / 100).toFixed(2)}`,
            total: `$${(total / 100).toFixed(2)}`
          });

          return {
            currentInvoice: {
              invoiceId: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              reservationId: snap.id,
              date: admin.firestore.Timestamp.now(),
              dueDate: snapData.paymentDue ?? admin.firestore.Timestamp.now(),

              user: { 
                id: snapData.User.id, 
                name: snapData.User.data().Name, 
                phone: snapData.User.data().CellNumber, 
                email: snapData.User.data().Email 
              },

              lineItems: [
                { tag: 'BASE', service: 'Child-Care', durationHours: billableHours,
                  rateCentsPerHour: 2000, subtotalCents: baseSubtotal },
                ...(lateAddon
                  ? [{ tag: 'LATE_PICKUP', service: 'Late pickup fee',
                       durationHours: 1, rateCentsPerHour: lateAddon, subtotalCents: lateAddon }]
                  : [])
              ],

              subtotalCents: subtotal, 
              taxCents: tax, 
              totalCents: total, 
              status: INVOICE_STATUS.UNPAID
            }
          };
        }),
        always: 'persistInvoice'
      },

      persistInvoice: {
        invoke: {
          src: 'persistInvoiceService',
          onDone: { target: 'incrementRes' },
          onError: { target: 'recordFailure' }
        }
      },

      incrementRes: {
        entry: 'incrementResIdx',
        always: 'nextReservation'
      },

      completeReservationPass: {
        invoke: {
          src: 'fetchOverdueInvoicesService',
          onDone: {
            target: 'nextOverdue',
            actions: assign({ overdueInvoices: (ctx, ev) => ev.data })
          },
          onError: 'fatalError'
        }
      },

      nextOverdue: {
        always: [
          { cond: (ctx) => ctx.overIdx >= ctx.overdueInvoices.length, target: 'completeRun' },
          { target: 'applyLateFee' }
        ]
      },

      applyLateFee: {
        invoke: {
          src: 'applyLateFeeService',
          onDone: {
            target: 'recalcHold',
            actions: assign({ affectedUserId: (ctx, ev) => ev.data.userId })
          },
          onError: { target: 'recordFailure' }
        }
      },

      recalcHold: {
        invoke: {
          src: 'recalcUserHoldService',
          onDone: { target: 'incrementOver' },
          onError: { target: 'recordFailure' }
        }
      },

      incrementOver: {
        entry: 'incrementOverIdx',
        always: 'nextOverdue'
      },

      completeRun: {
        invoke: {
          src: 'wrapUpService',
          onDone: 'done',
          onError: 'fatalError'
        }
      },

      recordFailure: {
        entry: 'addFailure',
        always: [
          { cond: (ctx) => ctx.value === 'applyLateFee', target: 'incrementOver' },
          { target: 'incrementRes' }
        ]
      },

      fatalError: { type: 'final' },
      done:       { type: 'final' }
    }
  },
  {
    /*───────────── services ───────────*/
    services: {
      initializeRunService: async () => {
        logger.info('🔧 [BILLING] Initializing billing run...');
        const runRef = db.collection('BillingRuns').doc();
        await runRef.set({ status: 'running', startTime: new Date() });
        logger.info('🔧 [BILLING] Created billing run:', { runId: runRef.id, timestamp: new Date().toISOString() });
        
        const resSnaps = await db.collection('Reservations')
          .where('invoice', '==', null)
          .where('status', '==', 'processing')
          .get();
        logger.info('🔧 [BILLING] Found reservations:', resSnaps.docs.length);
        
        return { runId: runRef.id, reservations: resSnaps.docs };
      },

      fetchOverdueInvoicesService: async () => {
        logger.info('🔧 [BILLING] Fetching overdue invoices...');
        const snap = await db.collection('Invoices')
          .where('status', '==', 'unpaid')
          .where('dueDate', '<', admin.firestore.Timestamp.now())
          .get();
        logger.info('🔧 [BILLING] Found overdue invoices:', snap.docs.length);
        return snap.docs;
      },

      persistInvoiceService: async (ctx) => {
        logger.info(`💾 [BILLING] Persisting invoice ${ctx.currentInvoice.invoiceId} for reservation ${ctx.currentInvoice.reservationId}`);
        if (ctx.dryRun) {
          logger.info('🔍 [BILLING] DRY-RUN: Would persist invoice:', ctx.currentInvoice);
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
      },

      recalcUserHoldService: async (ctx) => {
        const uid = ctx.affectedUserId;
        if (ctx.dryRun) {
          logger.info('🔍 [BILLING] DRY-RUN recalc hold', uid);
          return;
        }
        const snap = await db.collection('Invoices')
          .where('user.id', '==', uid)
          .where('status', 'in', ['unpaid', 'late'])
          .get();
        const hold = snap.size > 2;
        await db.collection('Users').doc(uid).set({ paymentHold: hold }, { merge: true });
      },

      wrapUpService: async (ctx) => {
        logger.info('🏁 [BILLING] Wrapping up billing run:', {
          runId: ctx.runId,
          failures: ctx.failures.length,
          reservationsProcessed: ctx.reservations.length
        });
        return db.collection('BillingRuns').doc(ctx.runId)
          .set({ status: 'success', endTime: new Date(), failures: ctx.failures }, { merge: true });
      }
    },

    /*───────────── actions dictionary ───────────*/
    actions: {
      // save runId + reservations when initializeRun resolves
      storeInitData: assign({
        runId:        (_ctx, ev) => {
          logger.info('🔧 [BILLING] Storing run data:', { runId: ev.data.runId, reservationCount: ev.data.reservations.length });
          return ev.data.runId;
        },
        reservations: (_ctx, ev) => {
          logger.info('🔧 [BILLING] Storing reservations:', ev.data.reservations.length, 'reservations found');
          return ev.data.reservations;
        }
      }),

      incrementResIdx: assign({ 
        resIdx: (ctx) => {
          const newIdx = ctx.resIdx + 1;
          logger.info(`🔧 [BILLING] Incrementing reservation index: ${ctx.resIdx} → ${newIdx}`);
          return newIdx;
        }
      }),
      incrementOverIdx: assign({ 
        overIdx: (ctx) => {
          const newIdx = ctx.overIdx + 1;
          logger.info(`🔧 [BILLING] Incrementing overdue index: ${ctx.overIdx} → ${newIdx}`);
          return newIdx;
        }
      }),

      // add a failure record
      addFailure: assign((ctx, ev) => ({
        failures: ctx.failures.concat({
          reservationId: ctx.reservations[ctx.resIdx]?.id ?? '-',
          invoiceId: ctx.overdueInvoices[ctx.overIdx]?.id ?? '-',
          userId: ctx.userId ?? '-',
          state: ctx.value,
          error: (ev.data || {}).message
        })
      }))
    }
  }
);

module.exports = { billingMachine };
