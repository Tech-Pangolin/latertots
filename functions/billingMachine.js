// billingMachine.js
const { createMachine, assign, interpret } = require('xstate');
const admin = require('firebase-admin');
const { billingConfig } = require('./billing-config');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('./constants');   


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

    /*───────────── actions dictionary ───────────*/
    actions: {
      // save runId + reservations when initializeRun resolves
      storeInitData: assign({
        runId:        (_ctx, ev) => ev.data.runId,
        reservations: (_ctx, ev) => ev.data.reservations
      }),

      incrementResIdx: assign({ resIdx: (ctx) => ctx.resIdx + 1 }),
      incrementOverIdx: assign({ overIdx: (ctx) => ctx.overIdx + 1 }),

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
    },

    /*───────────── states ───────────*/
    states: {
      /* 0 ─ initialize & preload reservations */
      initializeRun: {
        invoke: {
          // using services key (string) gives the actor a proper label
          src: 'initializeRunService'
        },
        onDone: {
          target: 'nextReservation',
          actions: 'storeInitData'
        },
        onError: 'fatalError'
      },

      /* PASS A : reservations → invoices */
      nextReservation: {
        always: [
          { cond: (ctx) => ctx.resIdx >= ctx.reservations.length, target: 'completeReservationPass' },
          { target: 'calculateCharges' }
        ]
      },

      calculateCharges: {
        entry: assign((ctx) => {
          const snap = ctx.reservations[ctx.resIdx];
          const snapData    = snap.data();
          const start = snapData.start.toDate();
          const end   = snapData.end.toDate();

          const billableMins = Math.max(                           // larger of minimum billable and true duration
            billingConfig.minBillableMinutes,
            Boolean(billingConfig.maxBillableMinutes) 
            ? Math.min(                                           // if config has a valid maxbillmins values
              billingConfig.maxBillableMinutes,
              convertToMinutes(end) - convertToMinutes(start)
            ) 
            : (convertToMinutes(end) - convertToMinutes(start))         // if not, just calculate difference
          );
          const billableHours = () => {
            const remainder = billableMins % billingConfig.billToNearestMinutes
            const roundedMinutes = remainder < billingConfig.pickupGracePeriodMinutes     // past the grace period?
              ? billableMins - remainder                                                  // if not, round down
              : (billableMins - remainder) + billingConfig.billToNearestMinutes           // if so, round up
            return +(roundedMinutes / 60).toFixed(2)                                      // return value in hours as a number
          }


          const baseSubtotal = Math.round(billableHours * billingConfig.baseRateCentsPerHour);

          const lateAddon = billingConfig.latePickupThresholdHours < billableHours ? billingConfig.serviceAddOns.LATE_PICKUP_FEE : 0;
          const subtotal  = baseSubtotal + lateAddon;
          const tax       = Math.round(subtotal * billingConfig.taxRateDecimal);
          const total     = subtotal + tax;

          return {
            currentInvoice: {
              invoiceId: crypto.getRandomValues().split('-').slice(0,2).join(''),     // generate new invoice id
              reservationId: snap.id,                                                 // preserve reservation id
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
                  rateCentsPerHour: billingConfig.baseRateCentsPerHour, subtotalCents: baseSubtotal },
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

      incrementRes: { entry: 'incrementResIdx', always: 'nextReservation' },

      /* — handoff to Overdue Invoices Pass — */
      completeReservationPass: {
        always: 'sweepOverdueInvoices'
      },

      /* Overdue Invoices Pass */
      sweepOverdueInvoices: {
        invoke: {
          src: 'fetchOverdueInvoicesService',
          onDone: {
            target: 'nextOverdue',
            actions: assign({
              overdueInvoices: (_ctx, ev) => ev.data,
              overIdx: (_ctx) => 0
            })
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
            target: 'recalcUserHold',
            actions: assign({ affectedUserId: (_ctx, ev) => ev.data.userId })
          },
          onError: 'recordFailure'
        }
      },

      recalcUserHold: {
        invoke: {
          src: 'recalcUserHoldService',
          onDone: 'incrementOver',
          onError: 'recordFailure'
        }
      },

      incrementOver: { entry: 'incrementOverIdx', always: 'nextOverdue' },

      
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
    },

    /*───────────── actor (service) implementations ───────────*/
    actors: {
      
      initializeRunService: async () => {
        const runRef = db.collection('BillingRuns').doc();
        await runRef.set({ status: 'running', startTime: new Date() });
        const resSnaps = await fetchAllReservationsSnap();
        return { runId: runRef.id, reservations: resSnaps.docs };
      },

      fetchOverdueInvoicesService: async () => {
        const snap = await fetchAllOverdueInvoicesSnap();
        return snap.docs;
      },

      persistInvoiceService: async (ctx) => {
        if (ctx.dryRun) {
          console.log('DRY‑RUN invoice', ctx.currentInvoice);
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
          console.log('DRY‑RUN late‑fee check', invSnap.id, { feeExists });
          return { userId: data.user.id };
        }

        if (!feeExists) {
          const feeLI = {
            tag: 'LATE_FEE',
            service: billingConfig.lateFee.lineItemLabel,
            durationHours: 1,
            rateCentsPerHour: billingConfig.lateFee.flatCents,
            subtotalCents: billingConfig.lateFee.flatCents
          };

          const newSubtotal = data.subtotalCents + feeLI.subtotalCents;
          const newTax      = Math.round(newSubtotal * billingConfig.taxRateDecimal);
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
          console.log('DRY‑RUN recalc hold', uid);
          return;
        }
        const snap = fetchUnpaidInvoicesSnapByUser();
        const hold = snap.size > billingConfig.maxAllowedUnpaid;
        await db.collection('Users').doc(uid).set({ paymentHold: hold }, { merge: true });
      },

      wrapUpService: (ctx) =>
        db.collection('BillingRuns').doc(ctx.runId)
          .set({ status: 'success', endTime: new Date(), failures: ctx.failures }, { merge: true })
    }
  }
);

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

/*──────────── Sample scheduler wrapper (optional) ───────────
const { onSchedule } = require('firebase-functions/v2/scheduler');

const dailyBilling = onSchedule('0 23 * * *', async () => {
  await interpret(billingMachine).start().done;
});
*/

module.exports = { billingMachine };
