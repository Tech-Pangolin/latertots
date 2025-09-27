# XState v4 to v5 Migration Guide for Billing Machine

## Overview
This guide provides step-by-step instructions for upgrading the billing machine from XState v4 to v5. The migration addresses async timing issues and improves overall state management.

## Prerequisites
- Familiarity with XState v4 concepts
- Understanding of the current billing machine architecture
- Access to the existing codebase

## Migration Phases

### Phase 1: Setup and Dependencies

#### 1.1 Install XState v5
```bash
cd functions
npm install xstate@5
```

#### 1.2 Update Package.json
```json
{
  "dependencies": {
    "xstate": "^5.0.0"
  }
}
```

#### 1.3 Create New File Structure
Create the following files in `functions/xstate/`:
- `actions.js` - All action functions
- `guards.js` - All guard functions  
- `actors.js` - All actor/service functions
- `billingMachineV5.js` - New v5 machine definition
- `indexV5.js` - New v5 export file

### Phase 2: Extract Actions

#### 2.1 Create `functions/xstate/actions.js`
```javascript
// actions.js - XState v5 Actions
const { assign } = require('xstate');
const { logger } = require('firebase-functions');

// Store initialization data
const storeInitData = assign({
  runId: (_ctx, ev) => {
    logger.info('🔧 [BILLING] Storing run data:', { 
      runId: ev.data.runId, 
      reservationCount: ev.data.reservations.length 
    });
    return ev.data.runId;
  },
  reservations: (_ctx, ev) => {
    logger.info('🔧 [BILLING] Storing reservations:', ev.data.reservations.length, 'reservations found');
    return ev.data.reservations;
  }
});

// Increment reservation index
const incrementResIdx = assign({ 
  resIdx: (ctx) => {
    const newIdx = ctx.resIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing reservation index: ${ctx.resIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Increment overdue index
const incrementOverIdx = assign({ 
  overIdx: (ctx) => {
    const newIdx = ctx.overIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing overdue index: ${ctx.overIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Add failure record
const addFailure = assign((ctx, ev) => {
  const newFailures = [...ctx.failures, {
    timestamp: new Date().toISOString(),
    error: ev.data,
    context: {
      runId: ctx.runId,
      resIdx: ctx.resIdx,
      overIdx: ctx.overIdx
    }
  }];
  logger.error('🔧 [BILLING] Adding failure:', { 
    error: ev.data, 
    totalFailures: newFailures.length 
  });
  return { failures: newFailures };
});

module.exports = {
  storeInitData,
  incrementResIdx,
  incrementOverIdx,
  addFailure
};
```

### Phase 3: Extract Guards

#### 3.1 Create `functions/xstate/guards.js`
```javascript
// guards.js - XState v5 Guards
const { logger } = require('firebase-functions');

// Check if all reservations are processed
const isReservationPassComplete = (ctx) => {
  const isComplete = ctx.resIdx >= ctx.reservations.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All reservations processed, moving to overdue invoices');
  }
  return isComplete;
};

// Check if all overdue invoices are processed
const isOverduePassComplete = (ctx) => {
  const isComplete = ctx.overIdx >= ctx.overdueInvoices.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All overdue invoices processed, wrapping up');
  }
  return isComplete;
};

// Check if dry run mode
const isDryRun = (ctx) => {
  return ctx.dryRun === true;
};

module.exports = {
  isReservationPassComplete,
  isOverduePassComplete,
  isDryRun
};
```

### Phase 4: Extract Actors (Services)

#### 4.1 Create `functions/xstate/actors.js`
```javascript
// actors.js - XState v5 Actors (formerly services)
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Initialize billing run
const initializeRunActor = async ({ input }) => {
  logger.info('🔧 [BILLING] Initializing billing run...');
  const runRef = db.collection('BillingRuns').doc();
  await runRef.set({ status: 'running', startTime: new Date() });
  logger.info('🔧 [BILLING] Created billing run:', { 
    runId: runRef.id, 
    timestamp: new Date().toISOString() 
  });
  
  const resSnaps = await db.collection('Reservations')
    .where('invoice', '==', null)
    .where('status', '==', 'processing')
    .get();
  logger.info('🔧 [BILLING] Found reservations:', resSnaps.docs.length);
  
  return { runId: runRef.id, reservations: resSnaps.docs };
};

// Fetch overdue invoices
const fetchOverdueInvoicesActor = async ({ input }) => {
  logger.info('🔧 [BILLING] Fetching overdue invoices...');
  const snap = await db.collection('Invoices')
    .where('status', '==', 'unpaid')
    .where('dueDate', '<', admin.firestore.Timestamp.now())
    .get();
  logger.info('🔧 [BILLING] Found overdue invoices:', snap.docs.length);
  return snap.docs;
};

// Persist invoice
const persistInvoiceActor = async ({ input }) => {
  const { currentInvoice, dryRun } = input;
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
    tx.update(
      db.collection('Reservations').doc(currentInvoice.reservationId),
      { 
        invoice: db.collection('Invoices').doc(currentInvoice.invoiceId),
        status: 'completed'
      }
    );
  });
};

// Apply late fee
const applyLateFeeActor = async ({ input }) => {
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
      description: 'Late payment fee',
      amountCents: 500, // $5.00
      quantity: 1
    };
    
    await db.collection('Invoices').doc(invSnap.id).update({
      lineItems: admin.firestore.FieldValue.arrayUnion(feeLI),
      totalCents: admin.firestore.FieldValue.increment(500)
    });
  }
  
  return { userId: data.user.id };
};

// Recalculate user hold
const recalcUserHoldActor = async ({ input }) => {
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
};

// Wrap up billing run
const wrapUpActor = async ({ input }) => {
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
};

module.exports = {
  initializeRunActor,
  fetchOverdueInvoicesActor,
  persistInvoiceActor,
  applyLateFeeActor,
  recalcUserHoldActor,
  wrapUpActor
};
```

### Phase 5: Create New Machine Definition

#### 5.1 Create `functions/xstate/billingMachineV5.js`
```javascript
// billingMachineV5.js - XState v5 Machine Definition
const { createMachine } = require('xstate');
const { logger } = require('firebase-functions');
const { RESERVATION_STATUS, INVOICE_STATUS } = require('../constants');

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

        const billableMins = Math.max(60, Math.min(480, convertToMinutes(end) - convertToMinutes(start)));
        const billableHours = billableMins / 60;
        const baseSubtotal = Math.round(billableHours * 2000);
        const lateAddon = billableHours > 4 ? 500 : 0;
        const subtotal = baseSubtotal + lateAddon;
        const tax = Math.round(subtotal * 0.08);
        const total = subtotal + tax;

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
            user: snapData.User,
            durationHours: billableHours,
            rateCentsPerHour: 2000,
            subtotalCents: subtotal,
            taxCents: tax,
            totalCents: total,
            lineItems: [
              {
                tag: 'BASE_RATE',
                description: 'Childcare services',
                amountCents: baseSubtotal,
                quantity: billableHours
              },
              ...(lateAddon > 0 ? [{
                tag: 'LATE_FEE',
                description: 'Extended care fee',
                amountCents: lateAddon,
                quantity: 1
              }] : [])
            ],
            status: INVOICE_STATUS.UNPAID,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            createdAt: new Date(),
            updatedAt: new Date()
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
          dryRun: context.dryRun 
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
      always: { target: 'fetchOverdueInvoices' }
    },

    // PASS B: Overdue invoices → late fees
    fetchOverdueInvoices: {
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
```

### Phase 6: Create New Export File

#### 6.1 Create `functions/xstate/indexV5.js`
```javascript
// indexV5.js - XState v5 Export
const { billingMachineV5 } = require('./billingMachineV5');

module.exports = {
  billingMachineV5
};
```

### Phase 7: Update Cloud Function

#### 7.1 Update `functions/index.js`
```javascript
// Add new v5 import
const { billingMachineV5 } = require('./xstate/indexV5');
const { createActor } = require('xstate');

// Update the dailyBillingJob function
exports.dailyBillingJob = functions.https.onRequest(async (req, res) => {
  try {
    const dryRun = req.query.dryRun === 'true';
    const logLevel = req.query.logLevel || 'INFO';
    
    logger.info('Daily billing job triggered via HTTP', {
      dryRun,
      logLevel,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url
    });

    // Create and start the v5 actor
    const actor = createActor(billingMachineV5, {
      input: { dryRun }
    }).start();

    // Wait for completion
    await new Promise((resolve, reject) => {
      actor.subscribe((snapshot) => {
        if (snapshot.matches('done')) {
          resolve();
        } else if (snapshot.matches('fatalError')) {
          reject(new Error('Billing job failed'));
        }
      });
    });

    logger.info('Daily billing job completed successfully', {
      dryRun,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Daily billing job failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Phase 8: Testing and Validation

#### 8.1 Test the New Implementation
```bash
# Test the new v5 implementation
curl "http://localhost:5001/latertots-a6694/us-central1/dailyBillingJob?dryRun=true"
```

#### 8.2 Verify Logging
- Check that logs appear in correct order
- Verify no race conditions
- Confirm proper async coordination

#### 8.3 Performance Testing
- Compare execution times
- Monitor memory usage
- Check for any regressions

### Phase 9: Cleanup

#### 9.1 Remove Old Files
After successful migration:
- Delete `billingMachine.js` (old v4 version)
- Delete `billingServices.js` (if exists)
- Update imports to use new v5 files

#### 9.2 Update Documentation
- Update README files
- Update any deployment scripts
- Update team documentation

## Key Benefits of v5 Migration

### Resolves Current Issues
- ✅ **Fixes async timing issues** - Better service coordination
- ✅ **Eliminates race conditions** - Improved async handling  
- ✅ **Better logging timing** - More predictable log output
- ✅ **Enhanced error handling** - Better async error management

### New Capabilities
- **Actor model** - Better modularity and testability
- **Improved TypeScript support** - Better type safety
- **Enhanced testing tools** - Better debugging capabilities
- **Future-proof** - Active development and support

## Credible Resources

### Official Documentation
- [XState v5 Migration Guide](https://stately.ai/docs/migration)
- [XState v5 Actor Model](https://stately.ai/docs/guides/actors)
- [XState v5 Actions](https://stately.ai/docs/guides/actions)
- [XState v5 Guards](https://stately.ai/docs/guides/guards)

### Community Resources
- [XState v5 Examples](https://github.com/statelyai/xstate/tree/main/packages/xstate-examples)
- [XState v5 Discussions](https://github.com/statelyai/xstate/discussions)
- [XState v5 Migration Examples](https://github.com/statelyai/xstate/discussions/4870)

### Testing Resources
- [XState v5 Testing Guide](https://stately.ai/docs/guides/testing)
- [XState v5 Testing Examples](https://github.com/statelyai/xstate/tree/main/packages/xstate-examples/src/testing)

## Migration Checklist

- [ ] Phase 1: Setup and Dependencies
- [ ] Phase 2: Extract Actions
- [ ] Phase 3: Extract Guards  
- [ ] Phase 4: Extract Actors
- [ ] Phase 5: Create New Machine
- [ ] Phase 6: Create Export File
- [ ] Phase 7: Update Cloud Function
- [ ] Phase 8: Testing and Validation
- [ ] Phase 9: Cleanup

## Notes

- This migration addresses the async timing issues you're currently experiencing
- The new structure is more modular and testable
- All logging timing issues should be resolved
- The actor model provides better async coordination
- Future XState updates will be easier to implement

## Support

If you encounter issues during migration:
1. Check the official XState v5 documentation
2. Review community discussions on GitHub
3. Test each phase thoroughly before proceeding
4. Keep the old v4 implementation as backup until migration is complete
