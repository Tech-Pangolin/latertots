// billingMachineV5.js - XState v5 Machine Definition
const { createMachine, assign } = require('xstate');
const { logger } = require('firebase-functions');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('../constants');
const admin = require('firebase-admin');

// Import actions, guards, and actors
const actions = require('./actions');
const guards = require('./guards');
const actors = require('./actors');

// Helper function
function convertToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

const billingMachineV5 = createMachine({
  id: 'dailyBillingJob',
  initial: 'initializeRun',
  context: () => ({
    runId: '',
    reservations: [],
    resIdx: 0,
    currentInvoice: undefined,
    overdueInvoices: [],
    overIdx: 0,
    failures: [],
    dryRun: process.env.DRY_RUN === 'true'
  }),
  states: {
    // State 0: Initialize & preload reservations
    initializeRun: {
      entry: () => logger.info('🚀 [BILLING] Starting billing run initialization...'),
      invoke: {
        src: actors.initializeRunActor,
        input: ({ context }) => ({ dryRun: context.dryRun }),
        onDone: {
          target: 'nextReservation',
          actions: actions.storeInitData
        },
        onError: {
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    // PASS A: Reservations → Invoices
    nextReservation: {
      entry: ({ context }) => logger.info(`🔍 [BILLING] Checking reservation ${context.resIdx + 1}/${context.reservations.length}`),
      always: [
        { 
          guard: guards.isReservationPassComplete,
          target: 'completeReservationPass' 
        },
        { 
          target: 'calculateCharges',
          actions: ({ context }) => logger.info(`💰 [BILLING] Processing reservation ${context.resIdx + 1}: ${context.reservations[context.resIdx]?.id}`)
        }
      ]
    },

    calculateCharges: {
      entry: assign(({ context }) => {
        const snap = context.reservations[context.resIdx];
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
      always: { target: 'persistInvoice' }
    },

    persistInvoice: {
      invoke: {
        src: actors.persistInvoiceActor,
        input: ({ context }) => ({ 
          currentInvoice: context.currentInvoice, 
          dryRun: context.dryRun,
          reservations: context.reservations,
          resIdx: context.resIdx
        }),
        onDone: { target: 'incrementRes' },
        onError: { 
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    incrementRes: {
      entry: actions.incrementResIdx,
      always: { target: 'nextReservation' }
    },

    completeReservationPass: {
      entry: () => logger.info('✅ [BILLING] Reservation pass complete, starting overdue invoices pass'),
      invoke: {
        src: actors.fetchOverdueInvoicesActor,
        input: ({ context }) => ({ dryRun: context.dryRun }),
        onDone: {
          target: 'nextOverdueInvoice',
          actions: assign({
            overdueInvoices: ({ event }) => event.output,
            overIdx: () => 0
          })
        },
        onError: {
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    // PASS B: Overdue invoices → late fees
    nextOverdueInvoice: {
      entry: ({ context }) => logger.info(`🔍 [BILLING] Checking overdue invoice ${context.overIdx + 1}/${context.overdueInvoices.length}`),
      always: [
        { 
          guard: guards.isOverduePassComplete,
          target: 'wrapUp' 
        },
        { target: 'applyLateFee' }
      ]
    },

    applyLateFee: {
      invoke: {
        src: actors.applyLateFeeActor,
        input: ({ context }) => ({ 
          overdueInvoices: context.overdueInvoices, 
          overIdx: context.overIdx, 
          dryRun: context.dryRun 
        }),
        onDone: {
          target: 'recalcUserHold',
          actions: assign({
            affectedUserId: ({ event }) => event.output.userId
          })
        },
        onError: { 
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    recalcUserHold: {
      invoke: {
        src: actors.recalcUserHoldActor,
        input: ({ context }) => ({ 
          uid: context.affectedUserId, 
          dryRun: context.dryRun 
        }),
        onDone: { target: 'incrementOver' },
        onError: { 
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    incrementOver: {
      entry: actions.incrementOverIdx,
      always: { target: 'nextOverdueInvoice' }
    },

    wrapUp: {
      invoke: {
        src: actors.wrapUpActor,
        input: ({ context }) => ({ 
          runId: context.runId, 
          failures: context.failures, 
          reservations: context.reservations, 
          dryRun: context.dryRun 
        }),
        onDone: { target: 'done' },
        onError: { 
          target: 'fatalError',
          actions: actions.addFailure
        }
      }
    },

    fatalError: { 
      type: 'final',
      entry: ({ context }) => logger.error('💥 [BILLING] Fatal error occurred:', { failures: context.failures })
    },
    done: { 
      type: 'final',
      entry: () => logger.info('✅ [BILLING] Billing run completed successfully')
    }
  }
});

module.exports = { billingMachineV5 };
