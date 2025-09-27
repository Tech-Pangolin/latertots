# Billing Machine Integration Development Notes

## Overview
Adapting the existing billingMachine scaffold to integrate with the current LaterTots application system.

## Key Design Decisions
- **Integration Strategy**: Adapt billingMachine to current system (Option A)
- **Reservation Status Flow**: `processing` → `unpaid` → `paid`/`late`
- **Invoice Relationship**: 1:1 relationship between Invoice and Reservation (shared UID)
- **Billing Lock**: `billingLocked: boolean` prevents programmatic changes after billing
- **Payment Hold**: `Users.paymentHold: boolean` based on unpaid/late invoice count
- **Override Support**: `overrideTotalCents` field bypasses calculation
- **Dry Run**: Use `DRY_RUN` env var for development/debugging

## Integration Points to Address

### Data Model Adaptations
- [x] Collection naming: Use `Reservations` (capital R) consistently
- [x] Status field location: Added top-level `status` alongside `extendedProps.status`
- [x] User data mapping for invoice generation
- [x] Reservation data structure alignment

### Missing Infrastructure
- [x] Invoice collection schema and security rules
- [ ] BillingRuns collection for audit trail
- [ ] Payment processing integration
- [ ] Admin interfaces for billing management

### Configuration Issues
- [ ] Tax rate calculation consistency
- [ ] Missing helper functions
- [ ] Environment variable handling

## Key Design Decisions & Requirements

### Infrastructure
- **Hosting**: Google Cloud Functions (most logical place for billing automation)
- **Logging**: Searchable Google Cloud logs with structured logging and proper tagging
  - Use structured JSON logs with consistent fields
  - Tag logs with `billingRunId`, `reservationId`, `invoiceId`, `userId`
  - Use severity levels: INFO, WARN, ERROR
  - Enable log-based metrics for monitoring
- **Collections**: Need to create new collections (Invoices, BillingRuns)

### New Collections Required

#### Invoices Collection
```javascript
{
  invoiceId: string,           // Unique invoice ID
  reservationId: string,      // Links to reservation
  date: Timestamp,            // Invoice creation date
  dueDate: Timestamp,         // Payment due date
  user: {
    id: string,
    name: string,
    phone: string,
    email: string
  },
  lineItems: Array<{
    tag: string,              // 'BASE', 'LATE_PICKUP', 'LATE_FEE'
    service: string,
    duration: number,
    rate: number,              // cents
    subtotal: number          // cents
  }>,
  subtotal: number,           // cents
  tax: number,                // cents
  total: number,              // cents
  status: 'unpaid' | 'paid' | 'late' | 'refunded'
}
```

#### BillingRuns Collection
```javascript
{
  runId: string,               // Unique run ID
  status: 'running' | 'success' | 'failed',
  startTime: Timestamp,
  endTime: Timestamp,
  successes: Array<{
    reservationId: string,
    invoiceId: string,
    userId: string,
    amount: number
  }>,
  failures: Array<{
    reservationId: string,
    invoiceId: string,
    userId: string,
    state: string,
    error: string
  }>
}
```

#### StripeAuditLog Collection
```javascript
{
  id: string,                    // Auto-generated
  invoiceId: DocumentReference,  // Links to invoice
  eventType: string,             // 'payment_intent.created', 'payment_intent.succeeded', etc.
  stripeEventId: string,         // Stripe's event ID
  stripePaymentIntentId: string, // Stripe's payment intent ID
  timestamp: Timestamp,          // When the event occurred
  data: Object,                  // Full Stripe event payload
  processed: boolean,            // Whether we successfully processed this event
  processingError: string,       // Any errors during processing
  createdAt: Timestamp           // When we logged this event
}
```


### Status & Naming Conventions
- **Current Issue**: `status: 'locked'` and `billingLocked: false` is not intuitive
- **Solution**: Remove billing status from reservations entirely
- **New Design**: 
  - Reservation carries `invoiceId` DocumentReference (null if not yet billed)
  - Billing status lives on the invoice itself
  - Query logic: `reservation.invoiceId === null` = not yet billed
- **Proposed INVOICE_STATUS enum**:
  ```javascript
  export const INVOICE_STATUS = Object.freeze({
    UNPAID: 'unpaid',
    PAID: 'paid', 
    LATE: 'late',
    REFUNDED: 'refunded',
    EXEMPT: 'exempt'  // No billing required (cancelled, comped, etc.)
  })
  ```
- **Benefits**: Single source of truth, simpler queries, cleaner data model

### Configuration Requirements
- **Late Invoice Threshold**: Configuration to define time until invoice becomes late
- **BillingRun Tracking**: Separate success and failure tracking in BillingRun document

### Updated Billing Configuration
```javascript
export const billingConfig = {
  // ... existing config
  lateInvoiceThresholdDays: 7,  // Invoices become late after 7 days
  // ... rest of config
}
```

## Payment Processing Integration

### Phase 3: Payment Intent Creation & Processing
- **Trigger**: After invoice creation (Phase 1 complete)
- **Process**: Create Stripe Payment Intent for each unpaid invoice
- **State Machine**: Extend billing machine with payment processing states
- **Integration**: Square API for payment processing
- **Feedback**: Webhook handling for payment status updates

### Payment Intent Creation Flow
```javascript
// New billing machine states for Phase 3
states: {
  // ... existing states
  createPaymentIntents: {
    invoke: {
      src: 'createPaymentIntentService',
      onDone: 'waitForPaymentFeedback',
      onError: 'recordPaymentFailure'
    }
  },
  waitForPaymentFeedback: {
    // Webhook-driven state transitions
    onPaymentSuccess: 'updateInvoicePaid',
    onPaymentFailed: 'updateInvoiceUnpaid',
    onRefundIssued: 'updateInvoiceRefunded'
  }
}
```

### Webhook Integration
- **Payment Success**: Update invoice status to 'paid'
- **Payment Failed**: Update invoice status to 'unpaid', retry billing
- **Refund Issued**: Update invoice status to 'refunded'
- **Idempotency**: Use StripeAuditLog collection for event tracking

### Payment Processing Services
```javascript
// New services for Phase 3
actors: {
  createPaymentIntentService: async (ctx) => {
    // Create Stripe Payment Intent for each unpaid invoice
    // Store Payment Intent ID in invoice
    // Log creation event in StripeAuditLog
  },
  
  handlePaymentWebhook: async (ctx) => {
    // Verify webhook signature
    // Check idempotency in StripeAuditLog
    // Update invoice status based on event type
    // Log webhook event in StripeAuditLog
  },
  
  processRefund: async (ctx) => {
    // Admin-triggered refund processing
    // Call Square API to process refund
    // Update invoice and reservation status
    // Log refund event in StripeAuditLog
  }
}
```

### Refund Processing
- **Refund Initiation**: Admin-triggered refund process
- **Status Updates**: Update invoice to 'refunded', reservation to 'refunded'
- **Audit Trail**: Track refund reasons and amounts
- **Square Integration**: Process refunds through Square API

## Resolved Questions

### Payment Processor
- **Decision**: Using Stripe (not Square)
- **Integration**: Stripe webhooks for payment feedback
- **API**: Stripe Payment Intents for payment processing

### Late Invoice Threshold
- **Decision**: Configurable value in billing-config.js
- **Implementation**: Add `lateInvoiceThresholdDays` to billing configuration

### Admin Interface Requirements
- **Decision**: Invoice management table in admin dashboard
- **Features**: 
  - Table view of all invoices with status
  - Action buttons per row (view details, process refund, etc.)
  - Status filtering and search capabilities

### Data Model Alignment
- **Decision**: Update billing machine to match current database state
- **Approach**: Adapt billing machine queries to use `Reservations` collection and `extendedProps.status`

### Testing Strategy
- **Decision**: Manual testing for initial implementation
- **Approach**: Use `DRY_RUN` environment variable for safe testing

## Remaining Questions to Resolve
- [ ] Stripe webhook endpoint structure and security
- [ ] Refund workflow and approval process
- [ ] Payment failure handling and retry logic
- [ ] Google Cloud logging tagging strategy for searchable logs
- [ ] Specific late invoice threshold value (days)
- [ ] Admin interface implementation details

## Cloud Functions Architecture

### Proposed Function Structure

#### 1. `dailyBillingJob` (Scheduled Function)
- **Trigger**: `onSchedule('0 23 * * *')` (daily at 11 PM)
- **Purpose**: Execute the complete billing machine state machine
- **Process**: 
  - Run billing machine from start to finish
  - Handle all phases: reservations → invoices → overdue → payment intents
  - Track progress in BillingRuns collection
  - Handle errors and failures

#### 2. `handleStripeWebhook` (HTTP Function)
- **Trigger**: `onRequest` (Stripe webhook endpoint)
- **Purpose**: Handle payment feedback from Stripe
- **Process**:
  - Verify webhook signature
  - Check idempotency in StripeAuditLog
  - Update invoice status based on event type
  - Log webhook events
  - Update reservation billing status

#### 3. `processRefund` (HTTP Function)
- **Trigger**: `onRequest` (Admin-triggered)
- **Purpose**: Handle refund processing
- **Process**:
  - Verify admin permissions
  - Call Stripe API for refund
  - Update invoice and reservation status
  - Log refund event

#### 4. `manualBillingRun` (HTTP Function)
- **Trigger**: `onRequest` (Admin-triggered)
- **Purpose**: Manual billing machine execution
- **Process**:
  - Allow admins to trigger billing runs manually
  - Support dry-run mode for testing
  - Handle emergency billing scenarios

### Function Dependencies
- **Shared**: billingMachine state machine, billing-config, all collections
- **Billing Machine**: Runs as single state machine, not separate functions
- **Communication**: Through Firestore collections (Invoices, BillingRuns, StripeAuditLog)

### State Machine Benefits
- **Robust error handling** - Built-in retry logic and failure recovery
- **State management** - Clear progression through billing phases
- **Audit trail** - Easy to track exactly where failures occur
- **Complex logic** - Handles edge cases and state transitions elegantly
- **Maintainability** - Single source of truth for billing logic
- **Testing** - Can test state machine in isolation

## Implementation Progress
- [x] Data model alignment
- [x] Invoice schema implementation
- [x] BillingAdjustment schema implementation
- [x] Reservation schema updates
- [x] DocumentReference validation system
- [x] Module system resolution
- [x] Emulator integration and testing
- [ ] BillingRun schema implementation
- [ ] StripeAuditLog schema implementation
- [ ] Billing machine query updates
- [ ] dailyBillingJob function implementation
- [ ] Security rules for new collections
- [ ] Testing strategy
- [ ] Deployment plan

## ✅ **COMPLETED IMPLEMENTATIONS**

### **Schema Files Created**
- `src/schemas/InvoiceSchema.js` - Complete invoice validation with business rules
- `src/schemas/BillingAdjustmentSchema.js` - Four adjustment types with chain management
- `src/Helpers/validationHelpers.mjs` - Unified DocumentReference validation
- `src/Helpers/constants.mjs` - Billing-related enums and constants

### **Schema Files Updated**
- `src/schemas/ReservationSchema.mjs` - Added invoice field, top-level status, removed billingLocked
- `emulator/firestore/seed.mjs` - Added Joi validation for reservations

### **Key Technical Decisions**
- **DocumentReference Validation**: Single `DocumentReferenceOrCompatible` helper for all fields
- **Module System**: ES modules (`.mjs`) for new schemas, resolved import conflicts
- **Data Model**: Invoice subcollection approach for billing adjustments
- **Collection Naming**: Consistent use of `Reservations` (capital R)

### **Testing Status**
- ✅ All schemas validated with emulator data
- ✅ 15 reservations created successfully with validation
- ✅ DocumentReference validation working with emulator objects
- ✅ Module system conflicts resolved

---
*This file will be updated as we work through the integration systematically.*
