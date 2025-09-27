# Billing Machine Integration - Current Status Report

## 🎯 **Project Overview**
We are integrating the `dailyBillingJob` function into the LaterTots application, starting with creating necessary Joi schemas for new data models. The goal is to implement a complete billing system with invoice generation, payment processing, and audit trails.

## ✅ **COMPLETED TASKS**

### **1. Git Repository Management**
- **Merged Feature Branches**: Successfully merged `119-bug-useallusers-only-fetching-the-current-user` and `integrate-firebase-emulator` branches
- **Squash Merge**: Used squash merge for `integrate-firebase-emulator` to protect sensitive data
- **Clean Repository**: All branches merged, working tree clean

### **2. Data Model Analysis & Planning**
- **Analyzed Current System**: Reviewed existing Firestore structure and billing machine expectations
- **Identified Gaps**: Documented misalignments between billing machine and current database
- **Dev Notes Review**: Comprehensive analysis of `billing-machine-devnotes.md` for integration strategy

### **3. Schema Design & Implementation**
- **InvoiceSchema.js**: Complete Joi schema with detailed validation rules, unit clarity, and business rule validation
- **BillingAdjustmentSchema.js**: Four distinct adjustment types (Override, Discount, Refund, Credit) with chain management
- **ReservationSchema.mjs**: Updated to align with billing machine requirements
- **Constants Integration**: Added billing-related enums to `constants.mjs`

### **4. Module System Resolution**
- **ES Module Conflicts**: Resolved conflicts between `.mjs` seed files and `.js` schema files
- **File Renaming**: `ReservationSchema.js` → `ReservationSchema.mjs`, `constants.js` → `constants.mjs`
- **Import Path Updates**: Updated all references across the codebase
- **Validation Helpers**: Created unified `validationHelpers.mjs` with DocumentReference validation

### **5. Reservation Model Updates**
- **Added `invoice` Field**: `DocumentReference | null` for linking to invoices
- **Added Top-Level `status`**: Alongside existing `extendedProps.status` for gradual migration
- **Removed `billingLocked`**: Billing status now lives on invoice, not reservation
- **Removed `overrideTotalCents`**: Will use BillingAdjustments subcollection instead
- **Collection Name**: Kept `Reservations` (capital R) consistently

### **6. DocumentReference Validation**
- **Custom Validation Logic**: Created flexible validation that works with both production and emulator DocumentReferences
- **Unified Validation Helper**: Single `DocumentReferenceOrCompatible` for all DocumentReference fields
- **Emulator Compatibility**: Handles Firebase emulator DocumentReference objects that aren't true instances
- **Usage Pattern**: `.required()` for required fields, `.optional().allow(null)` for optional fields

### **7. Emulator Integration**
- **Joi Validation in Seed**: Implemented validation in `emulator/firestore/seed.mjs`
- **Successful Testing**: All 15 reservations created with proper validation
- **Data Structure Alignment**: Seed data matches new schema requirements

### **8. Constants & Enums**
- **INVOICE_STATUS**: `UNPAID`, `PAID`, `LATE`, `REFUNDED`
- **LINE_ITEM_TAGS**: `BASE`, `LATE_PICKUP`, `LATE_FEE`
- **BILLING_ADJUSTMENT_TYPES**: `OVERRIDE`, `REFUND`, `DISCOUNT`, `CREDIT`
- **DISCOUNT_TYPES**: `PERCENTAGE`, `FIXED`
- **REFUND_CATEGORIES**: `CUSTOMER_REQUEST`, `SERVICE_ISSUE`, `DUPLICATE_PAYMENT`, `ADMINISTRATIVE`
- **CREDIT_SOURCES**: `GOODWILL`, `SERVICE_CREDIT`, `PROMOTIONAL`, `ADMINISTRATIVE`

## 🔄 **CURRENT STATUS**

### **Data Model Alignment**
- ✅ **Reservation Schema**: Updated and validated
- ✅ **Invoice Schema**: Complete with business rules
- ✅ **BillingAdjustment Schema**: Complete with chain management
- ⏳ **BillingRun Schema**: Pending implementation
- ⏳ **StripeAuditLog Schema**: Pending implementation

### **Module System**
- ✅ **ES Module Conflicts**: Resolved
- ✅ **Import Paths**: All updated
- ✅ **Validation Helpers**: Unified and working

### **Testing & Validation**
- ✅ **Seed Script**: Working with Joi validation
- ✅ **DocumentReference Validation**: Working with emulator
- ✅ **Schema Integration**: All schemas properly integrated

## 📋 **PENDING TASKS**

### **High Priority**
1. **Create BillingRun Schema**: For tracking billing job runs
2. **Create StripeAuditLog Schema**: For payment tracking
3. **Update Billing Machine Queries**: Match current Firestore structure
4. **Implement dailyBillingJob Function**: Core Cloud Function with error handling

### **Medium Priority**
5. **Security Rules**: For new collections (Invoices, BillingRuns, StripeAuditLog)
6. **Admin Interfaces**: Invoice management dashboard
7. **Payment Processing**: Stripe integration

### **Low Priority**
8. **Testing Strategy**: Comprehensive test suite
9. **Deployment Plan**: Production deployment strategy

## 🏗️ **ARCHITECTURE DECISIONS MADE**

### **Data Model**
- **Invoice Relationship**: 1:1 between Invoice and Reservation
- **Billing Status**: Lives on invoice, not reservation
- **Adjustments**: Invoice subcollection approach for better data locality
- **Collection Names**: Use `Reservations` (capital R) consistently

### **Validation Strategy**
- **Single Validation Helper**: `DocumentReferenceOrCompatible` for all DocumentReference fields
- **Emulator Compatibility**: Custom validation logic for Firebase emulator objects
- **Business Rules**: Validation ensures data integrity (e.g., total = subtotal + tax)

### **Module System**
- **ES Modules**: Preferred for new schemas (`.mjs` extension)
- **Unified Validation**: Single source of truth for DocumentReference validation
- **Import Consistency**: All schemas use consistent import patterns

## 🔧 **TECHNICAL IMPLEMENTATION DETAILS**

### **Schema Structure**
```javascript
// Reservation (updated)
{
  invoice: DocumentReference | null,  // Links to invoice, null if unbilled
  status: string,                     // Top-level status for billing machine
  // ... existing fields
}

// Invoice (new)
{
  invoiceId: string,
  reservationId: DocumentReference,
  user: { id, name, phone, email },
  lineItems: Array<{ tag, service, duration, rate, subtotal }>,
  subtotalCents: number,
  taxCents: number,
  totalCents: number,
  status: 'unpaid' | 'paid' | 'late' | 'refunded',
  adjustments: Array<BillingAdjustment>
}

// BillingAdjustment (new)
{
  type: 'OVERRIDE' | 'DISCOUNT' | 'REFUND' | 'CREDIT',
  amountCents: number,
  reason: string,
  appliedBy: string,
  appliedAt: Timestamp,
  // ... type-specific fields
}
```

### **Validation Patterns**
```javascript
// Required DocumentReference
Child: DocumentReferenceOrCompatible.required(),

// Optional DocumentReference (allows null)
invoice: DocumentReferenceOrCompatible.optional().allow(null),
```

## 🚨 **KNOWN ISSUES & SOLUTIONS**

### **ScheduleChildSitterPage Redirect Issue**
- **Problem**: Users with children being redirected to profile
- **Root Cause**: Method signature mismatch in `fetchAllCurrentUsersChildren`
- **Solution**: Remove email parameter from method call
- **Status**: Identified but not yet fixed

### **Module System Conflicts**
- **Problem**: ES module vs CommonJS conflicts
- **Solution**: Renamed files to `.mjs` and updated import paths
- **Status**: ✅ Resolved

### **DocumentReference Validation**
- **Problem**: Emulator DocumentReferences not recognized by Joi
- **Solution**: Custom validation logic for emulator compatibility
- **Status**: ✅ Resolved

## 📁 **KEY FILES CREATED/MODIFIED**

### **New Files**
- `src/schemas/InvoiceSchema.js`
- `src/schemas/BillingAdjustmentSchema.js`
- `src/Helpers/validationHelpers.mjs`
- `BILLING_INTEGRATION_STATUS.md` (this file)

### **Modified Files**
- `src/schemas/ReservationSchema.mjs` (renamed from .js)
- `src/Helpers/constants.mjs` (renamed from .js)
- `emulator/firestore/seed.mjs`
- `billing-machine-devnotes.md`

### **Deleted Files**
- `src/Helpers/validationHelpers.js` (merged into .mjs)
- `debug-refs.mjs` (temporary debug file)

## 🎯 **NEXT STEPS FOR CONTINUATION**

1. **Immediate**: Create BillingRun and StripeAuditLog schemas
2. **Short-term**: Update billing machine queries to match current structure
3. **Medium-term**: Implement dailyBillingJob Cloud Function
4. **Long-term**: Payment processing and admin interfaces

## 📚 **REFERENCE MATERIALS**

- **Dev Notes**: `billing-machine-devnotes.md` - Original integration strategy
- **Billing Machine**: `functions/billingMachine.js` - XState state machine
- **Billing Config**: `functions/billing-config.js` - Pricing and configuration
- **Current Functions**: `functions/index.js` - Existing Cloud Functions

## 🔍 **DEBUGGING INFORMATION**

- **Seed Script**: `npm run emulator:seed` - Test data generation
- **Validation**: All schemas working with emulator data
- **Module System**: ES modules properly configured
- **DocumentReference**: Custom validation working with emulator

---

**Last Updated**: Current session
**Status**: Ready for next phase (BillingRun & StripeAuditLog schemas)
**Next Agent**: Continue with schema implementation and billing machine integration
