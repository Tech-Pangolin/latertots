// billingMachine.js
import { createMachine, assign, interpret } from 'xstate';
import * as admin from 'firebase-admin';
import { billingConfig } from './billing-config.js';   

// ────────── Firebase init (only once per bundle) ──────────
admin.initializeApp();
const db = admin.firestore();

/*──────────────── helpers ────────────────*/
function convertToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/*──────────────── state machine ──────────*/
export const billingMachine = createMachine(
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


          const baseSubtotal = snapData.overrideTotalCents ??    // use overrided value if exists on reservation
            Math.round(billableHours * billingConfig.baseRateCentsPerHour);

          const lateAddon = billingConfig.latePickupThresholdHours < billableHours ? billingConfig.serviceAddOns.LATE_PICKUP_FEE : 0;
          const subtotal  = baseSubtotal + lateAddon;
          const tax       = Math.round(subtotal * billingConfig.taxRatePct / 100);
          const total     = subtotal + tax;

          return {
            currentInvoice: {
              invoiceId: crypto.getRandomValues().split('-').slice(0,2).join(''),     // generate new invoice id
              reservationId: snap.id,                                                 // preserve reservation id
              date: admin.firestore.Timestamp.now(),
              dueDate: snapData.paymentDue ?? admin.firestore.Timestamp.now(),

              user: { id: snapData.User.id, name: snapData.User.name, phone: snapData.User.phone, email: snapData.User.email },

              lineItems: [
                { tag: 'BASE', service: 'Child-Care', duration: billableHours,
                  rate: billingConfig.baseRateCentsPerHour, subtotal: baseSubtotal },
                ...(lateAddon
                  ? [{ tag: 'LATE_PICKUP', service: 'Late pickup fee',
                       duration: 1, rate: lateAddon, subtotal: lateAddon }]
                  : [])
              ],

              subtotal, tax, total, status: 'unpaid'
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
          tx.update(ctx.reservations[ctx.resIdx].ref, { billingLocked: true });
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
            duration: 1,
            rate: billingConfig.lateFee.flatCents,
            subtotal: billingConfig.lateFee.flatCents
          };

          const newSubtotal = data.subtotal + feeLI.subtotal;
          const newTax      = Math.round(newSubtotal * billingConfig.taxRatePct / 100);
          await invSnap.ref.update({
            status: 'late',
            lineItems: admin.firestore.FieldValue.arrayUnion(feeLI),
            subtotal: newSubtotal,
            tax: newTax,
            total: newSubtotal + newTax
          });
        } else {
          await invSnap.ref.update({ status: 'late' });
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
  return await db.collection('Reservations')              // will probably need tweaking
    .where('billingLocked', '==', false)
    .where('status',        '==', 'locked')
    .get();
}

const fetchAllOverdueInvoicesSnap = async () => {
  return await db.collection('Invoices')                      // will probably need tweaking
  .where('status',  '==', 'unpaid')
  .where('dueDate', '<', admin.firestore.Timestamp.now())
  .get();
}

const fetchUnpaidInvoicesSnapByUser = async (uid) => {
  return await db.collection('Invoices')                      // will probably need tweaking
  .where('user.id', '==', uid)
  .where('status', 'in', ['unpaid', 'late'])
  .get();
}

/*──────────── Sample scheduler wrapper (optional) ───────────
import { onSchedule } from 'firebase-functions/v2/scheduler';

export const dailyBilling = onSchedule('0 23 * * *', async () => {
  await interpret(billingMachine).start().done;
});
*/
