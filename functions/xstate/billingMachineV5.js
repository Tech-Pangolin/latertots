// billingMachineV5.js - XState v5 Machine Definition
const { setup, assign } = require('xstate');
const { logger } = require('firebase-functions');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('../constants');
const admin = require('firebase-admin');
const _ = require('lodash');

// Import actions, guards, and actors
const actions = require('./actions');
const guards = require('./guards');
const actors = require('./actors');

// Helper function
function convertToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

const billingMachineV5 = setup({
  actors: {
    initializeRunActor: actors.initializeRunActor,
    fetchOverdueInvoicesActor: actors.fetchOverdueInvoicesActor,
    persistInvoiceActor: actors.persistInvoiceActor,
    applyLateFeeActor: actors.applyLateFeeActor,
    recalcUserHoldActor: actors.recalcUserHoldActor,
    wrapUpActor: actors.wrapUpActor
  },
  actions: {
    incrementResIdx: actions.incrementResIdx,
    incrementOverIdx: actions.incrementOverIdx,
    addFailure: actions.addFailure,
    categorizeError: actions.categorizeError,
    logError: actions.logError
  },
  guards: {
    isReservationPassComplete: guards.isReservationPassComplete,
    isOverduePassComplete: guards.isOverduePassComplete,
    isDryRun: guards.isDryRun,
    isCriticalError: guards.isCriticalError,
    isBusinessLogicError: guards.isBusinessLogicError,
    isTransientError: guards.isTransientError,
    isRetryableError: guards.isRetryableError,
    hasRetryAttemptsRemaining: guards.hasRetryAttemptsRemaining
  }
}).createMachine({
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
    newInvoices: [],
    dryRun: process.env.DRY_RUN === 'true'
  }),
  states: {
    // State 0: Initialize & preload reservations
    initializeRun: {
      entry: () => logger.info('🚀 [BILLING] Starting new billing run'),
      invoke: {
        src: 'initializeRunActor',
        input: ({ context }) => {
          return { dryRun: context.dryRun };
        },
        onDone: {
          target: 'storeData',
        },
        onError: {
          target: 'initializationFailed',
          actions: ({ event }) => logger.error('❌ [BILLING] Initialize run failed - no billing run created:', {
            error: event.error?.message,
            code: event.error?.code,
            runId: 'none'
          })
        }
      }
    },

    // Store the data from the actor
    storeData: {
      entry: [
        ({ event }) => logger.info('🔍 [BILLING] StoreData entry - DEBUG:', {
          eventOutput: event.output,
          runId: event.output?.runId,
          reservationsCount: event.output?.reservations?.length || 0,
          userDataKeys: Object.keys(event.output?.userData || {})
        }),
        assign({
          runId: ({ event }) => {
            const runId = event.output?.runId || '';
            logger.info('🔍 [BILLING] Storing runId:', { runId });
            return runId;
          },
          reservations: ({ event }) => {
            const reservations = event.output?.reservations || [];
            logger.info('🔍 [BILLING] Storing reservations:', { count: reservations.length });
            return reservations;
          },
          userData: ({ event }) => {
            const userData = event.output?.userData || {};
            logger.info('🔍 [BILLING] Storing userData:', { keys: Object.keys(userData) });
            return userData;
          }
        })
      ],
      always: { target: 'nextReservation' }
    },

    // Initialization failed - no billing run created
    initializationFailed: {
      entry: () => logger.error('❌ [BILLING] Billing run ended in failure due to initialization error'),
      type: 'final'
    },

    // PASS A: Reservations → Invoices
    nextReservation: {
      always: [
        { 
          guard: guards.isReservationPassComplete,
          target: 'completeReservationPass' 
        },
        { 
          target: 'calculateCharges',
          actions: ({ context }) => logger.info(`💰 [BILLING] Processing reservation ${context.resIdx + 1}/${context.reservations.length}: ${context.reservations[context.resIdx]?.id}`, { runId: context.runId })
        }
      ]
    },

    calculateCharges: {
      entry: assign(({ context }) => {
        const snap = context.reservations[context.resIdx];
        const snapData = snap.data();
        const start = snapData.start.toDate();
        const end = snapData.end.toDate();
        
        
        const billableMins = Math.max(60, // minimum 1 hour
          Math.min(480, // max 8 hours
            convertToMinutes(end) - convertToMinutes(start)
          )
        );
        const billableHours = billableMins / 60;

        logger.info(`💻 [BILLING] Calculating charges for reservation ${snap.id}:`, {
          start: start.toISOString(),
          end: end.toISOString(),
          duration: `${billableHours.toFixed(2)} hours`,
          runId: context.runId
        });

        const rateCentsPerHour = 2000;
        const baseSubtotal = Math.round(billableHours * rateCentsPerHour); // $20/hour
        const lateAddon = billableHours > 4 ? 500 : 0; // $5 late fee if over 4 hours
        const subtotal  = baseSubtotal + lateAddon;
        const tax       = Math.round(subtotal * 0.08); // 8% tax
        const total     = subtotal + tax;

        logger.info(`💵 [BILLING] Invoice calculation completed:`, {
          runId: context.runId,
          reservationId: snap.id,
          rateCentsPerHour,
          billableHours: billableHours.toFixed(2),
          baseSubtotal: `$${(baseSubtotal / 100).toFixed(2)}`,
          lateAddon: `$${(lateAddon / 100).toFixed(2)}`,
          subtotal: `$${(subtotal / 100).toFixed(2)}`,
          tax: `$${(tax / 100).toFixed(2)}`,
          total: `$${(total / 100).toFixed(2)}`
        });

        const generateRandomDateFromPast7Days = () => {
          const now = new Date();
          // Generate a random number of days between 0 and 6 (inclusive)
          const randomDays = Math.floor(Math.random() * 7);
          // Create a new date that is randomDays ago from now
          const randomDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
          return randomDate;
        };

        return {
          currentInvoice: {
            invoiceId: `INV-${String(Date.now()).split('').reverse().join('').substring(2,7)}-${Math.random().toString(36).substring(2, 7)}`,
            reservationId: snap.id,
            date: new Date(),
            dueDate: snapData.paymentDue ?? generateRandomDateFromPast7Days(), // TODO: remove the dummy data generation before production

            user: { 
              id: snapData.User.id, 
              name: context.userData[snapData.User.id]?.Name || 'Unknown', 
              phone: context.userData[snapData.User.id]?.CellNumber || 'Unknown', 
              email: context.userData[snapData.User.id]?.Email || 'Unknown'
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
      always: { target: 'persistInvoice',}
    },

    persistInvoice: {
      invoke: {
        src: 'persistInvoiceActor',
        input: ({ context }) => ({ 
          currentInvoice: context.currentInvoice, 
          dryRun: context.dryRun,
          reservations: context.reservations,
          resIdx: context.resIdx,
          newInvoices: context.newInvoices,
          runId: context.runId
        }),
        onDone: { 
          target: 'incrementRes',
          actions: [
            assign({
              newInvoices: ({ event }) => event.output
            })
          ]
        },
        onError: { 
          target: 'categorizeError',
          actions: [
            ({ event }) => logger.error('❌ [BILLING] Persist invoice error event:', event)
          ]
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
        src: 'fetchOverdueInvoicesActor',
        input: ({ context }) => ({ dryRun: context.dryRun }),
        onDone: {
          target: 'nextOverdueInvoice',
          actions: [
            assign({
              overdueInvoices: ({ event }) => event.output,
              overIdx: () => 0
            })
          ]
        },
        onError: {
          target: 'categorizeError',
          actions: [
            ({ event }) => logger.error('❌ [BILLING] Fetch overdue invoices error event:', event)
          ]
        }
      }
    },

    // PASS B: Overdue invoices → late fees
    nextOverdueInvoice: {
      entry: ({ context }) => {},
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
        src: 'applyLateFeeActor',
        input: ({ context }) => ({ 
          overdueInvoices: context.overdueInvoices, 
          overIdx: context.overIdx, 
          dryRun: context.dryRun 
        }),
        onDone: {
          target: 'recalcUserHold',
          actions: [
            assign({
              affectedUserId: ({ event }) => event.output.userId
            })
          ]
        },
        onError: { 
          target: 'categorizeError'
        }
      }
    },

    recalcUserHold: {
      invoke: {
        src: 'recalcUserHoldActor',
        input: ({ context }) => ({ 
          uid: context.affectedUserId, 
          dryRun: context.dryRun 
        }),
        onDone: { target: 'incrementOver' },
        onError: { 
          target: 'categorizeError'
        }
      }
    },

    incrementOver: {
      entry: actions.incrementOverIdx,
      always: { target: 'nextOverdueInvoice' }
    },

    wrapUp: {
      invoke: {
        src: 'wrapUpActor',
        input: ({ context }) => ({ 
          runId: context.runId, 
          failures: context.failures, 
          reservations: context.reservations, 
          dryRun: context.dryRun, 
          overdueInvoices: context.overdueInvoices, 
          newInvoices: context.newInvoices,
          finalStatus: context.finalStatus || 'success', // Default to success
          hasFailures: context.failures.length > 0
        }),
        onDone: { target: 'done' },
        onError: { 
          target: 'done',
          actions: ({ event }) => logger.error('❌ [BILLING] WrapUp failed - completing run anyway:', {
            error: event.error?.message
          })
        }
      }
    },

    // Error categorization state
    categorizeError: {
      entry: [
        actions.categorizeError,
        actions.logError,
        actions.addFailure
      ],
      always: [
        { 
          guard: guards.isCriticalError,
          target: 'criticalError' 
        },
        { 
          guard: guards.isBusinessLogicError,
          target: 'businessLogicError' 
        },
        { 
          guard: guards.isTransientError,
          target: 'transientError' 
        },
        { 
          target: 'criticalError' // Default to critical for unknown errors
        }
      ]
    },

    // Critical errors that stop the entire run
    criticalError: { 
      entry: ({ context }) => logger.error('❌ [BILLING] Critical error occurred - DEBUG:', { 
        failures: context.failures,
        lastError: context.lastError,
        contextRunId: context.runId,
        contextFailuresCount: context.failures?.length || 0,
        contextReservationsCount: context.reservations?.length || 0
      }),
      always: { 
        target: 'wrapUp',
        actions: assign({ finalStatus: 'failed' })
      }
    },

    // Business logic errors that allow continuation
    businessLogicError: {
      entry: ({ context }) => logger.warn('⚠️ [BILLING] Business logic error occurred - DEBUG:', { 
        lastError: context.lastError,
        contextRunId: context.runId,
        contextFailuresCount: context.failures?.length || 0,
        contextReservationsCount: context.reservations?.length || 0,
        resIdx: context.resIdx,
        overIdx: context.overIdx
      }),
      always: [
        { 
          guard: guards.isReservationPassComplete,
          target: 'completeReservationPass' 
        },
        { 
          target: 'incrementRes' 
        }
      ]
    },

    // Transient errors that can be retried
    transientError: {
      entry: ({ context }) => logger.warn('🔄 [BILLING] Transient error occurred, will retry - DEBUG:', { 
        lastError: context.lastError,
        contextRunId: context.runId,
        contextFailuresCount: context.failures?.length || 0,
        contextReservationsCount: context.reservations?.length || 0,
        resIdx: context.resIdx,
        overIdx: context.overIdx
      }),
      always: [
        { 
          guard: guards.hasRetryAttemptsRemaining,
          target: 'retryOperation' 
        },
        { 
          target: 'incrementRes' // After max retries, continue with next item
        }
      ]
    },

    // Retry operation state
    retryOperation: {
      entry: ({ context }) => logger.info('🔄 [BILLING] Retrying operation:', { 
        operation: context.lastError?.operation,
        retryCount: (context.lastError?.retryCount || 0) + 1
      }),
      after: {
        5000: { target: 'retryCurrentOperation' } // Wait 5 seconds before retry
      }
    },

    // Retry the current operation
    retryCurrentOperation: {
      entry: assign({
        lastError: ({ context }) => ({
          ...context.lastError,
          retryCount: (context.lastError?.retryCount || 0) + 1
        })
      }),
      always: [
        { 
          guard: ({ context }) => context.lastError?.operation === 'CREATE_INVOICE',
          target: 'persistInvoice' 
        },
        { 
          guard: ({ context }) => context.lastError?.operation === 'APPLY_LATE_FEE',
          target: 'applyLateFee' 
        },
        { 
          guard: ({ context }) => context.lastError?.operation === 'RECALC_USER_HOLD',
          target: 'recalcUserHold' 
        },
        { 
          target: 'incrementRes' // Default fallback - continue processing
        }
      ]
    },

    // Legacy fatal error state (kept for backward compatibility)
    fatalError: { 
      type: 'final',
      entry: ({ context }) => logger.error('❌ [BILLING] Fatal error occurred:', { failures: context.failures })
    },
    done: {
      always: [
        {
          guard: ({ context }) => context.failures.length > 0,
          target: 'completedWithProblems'
        },
        {
          target: 'completedSuccessfully'
        }
      ]
    },

    completedSuccessfully: {
      type: 'final',
      entry: ({ context }) => logger.info('✅ [BILLING] Billing run completed successfully', {runId: context.runId})
    },

    completedWithProblems: {
      type: 'final',
      entry: ({ context }) => logger.info('⚠️ [BILLING] Billing run completed with problems:', {
        failuresCount: context.failures.length,
        runId: context.runId
      })
    }
  }
});

module.exports = { billingMachineV5 };
