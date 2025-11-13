// constants.mjs - ES module constants for React app
// 
// ⚠️  IMPORTANT: This file contains the full set of constants for the React app
// ⚠️  When updating constants, check if changes need to be made in BOTH files:
// ⚠️  - src/Helpers/constants.mjs (ES module for React app) ← THIS FILE
// ⚠️  - functions/constants.js (CommonJS for Cloud Functions)
// ⚠️  This duplication exists due to module system incompatibility between React (ESM) and Cloud Functions (CommonJS)

export const COLLECTIONS = Object.freeze({
  CHILDREN: 'Children',
  USERS: 'Users',
  CONTACTS: 'Contacts',
  PERMISSIONS: 'Parent_Authorized_Permissions',
  RESERVATIONS: 'Reservations',
  ROLES: 'Roles',
  NOTIFICATIONS: 'Notifications',
  INVOICES: 'Invoices',
  SERVICE_PRICES: 'ServicePrices',
})

export const MIN_RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const BUSINESS_HRS = Object.freeze({
  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
  startTime: '07:00',
  endTime: '19:00',
  overlap: false
})

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  PARENT: 'parent-user',
})

export const RESERVATION_STATUS = Object.freeze({
  PENDING: 'pending',         // Represents a reservation that is awaiting confirmation by the admin
  CONFIRMED: 'confirmed',     // Represents time between reservation confirmation and service rendered
  DROPPED_OFF: 'dropped-off', // Child has arrived for service
  PICKED_UP: 'picked-up',     // Child has left, service completed
  CANCELLED: 'cancelled',     // Represents a reservation that does not require payment
  NO_SHOW: 'no-show',         // Represents a reservation that was not attended. Fees may apply.
  REFUND_REQUESTED: 'refund-requested', // Refund has been requested, awaiting processing
  REFUNDED: 'refunded',       // Refund has been processed

  // The following statuses are used for billing purposes

  PROCESSING: 'processing',   // Represents time between rendered service and invoice creation
  PAID: 'paid',
})

export const DEPOSIT_TYPES = Object.freeze({
  MINIMUM: 'minimum',         // Pay 2-hour minimum upfront
  FULL: 'full'               // Pay full amount upfront
})

export const GENDERS = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  UNSPECIFIED: "Unspecified",
})

export const CONTACT_RELATIONS = Object.freeze({
  PARENT: 'Parent',
  FAMILY: 'Family',
  LEGAL_GUARDIAN: 'Legal Guardian',
  FAMILY_FRIEND: 'Family Friend',
  DOCTOR: 'Doctor',
  PROFESSIONAL_CAREGIVER: 'Professional Caregiver',
  OTHER: 'Other',
})

export const CONTACT_PERMISSIONS = Object.freeze({
  MAKE_CONTACT_TO_CHILD: 'Make_Contact_To_Child',
  MEDICAL_AID: 'Medical_Aid',
  PICKUP: 'Pickup',
  RECEIVE_CONTACT_FROM_CHILD: 'Receive_Contact_From_Child',
})

export const MIN_AGE_FOR_CHILD_YEARS = 2;

export const NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: 'system',
  ADMIN: 'admin',
})

export const INVOICE_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
  LATE: 'late',
  REFUNDED: 'refunded'
})

export const LINE_ITEM_TAGS = Object.freeze({
  BASE: 'BASE',
  LATE_PICKUP: 'LATE_PICKUP',
  LATE_FEE: 'LATE_FEE',
  MINIMUM_DEPOSIT: 'MINIMUM_DEPOSIT',    // New: for minimum payments
  REMAINDER: 'REMAINDER',                 // New: for remainder payments
  GROUP_ACTIVITY: 'GROUP_ACTIVITY'       // New: for group activity fees
})

export const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
})

export const REFUND_CATEGORIES = Object.freeze({
  CUSTOMER_REQUEST: 'customer_request',
  SERVICE_ISSUE: 'service_issue',
  DUPLICATE_PAYMENT: 'duplicate_payment',
  ADMINISTRATIVE: 'administrative'
})

export const CREDIT_SOURCES = Object.freeze({
  GOODWILL: 'goodwill',
  SERVICE_CREDIT: 'service_credit',
  PROMOTIONAL: 'promotional',
  ADMINISTRATIVE: 'administrative'
})

export const ALERT_TYPES = Object.freeze({
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'danger', // Semantic 'error' maps to Bootstrap 'danger' class
})

export const IMAGE_UPLOAD = Object.freeze({
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 1,
})

export const ERROR_MESSAGES = Object.freeze({
  SYSTEM_VALIDATION_FAILURE: 'A problem was detected with your submission.',
  SYSTEM_PROCESSING_ERROR: 'Something went wrong processing your request.',
  SYSTEM_SUBMISSION_ERROR: 'An error occurred while processing your submission.',
  UNAUTHORIZED_ACCESS: 'Unauthorized access.',
})

export const LOGGER_ERROR_MESSAGES = Object.freeze({
  NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
  SYSTEM_ERROR: 'An unexpected error occurred. Please try again later.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in and try again.',
  VALIDATION_ERROR: 'There was a problem with your request.',
})

export const SERVICE_PRICE_LOOKUP_UIDS = Object.freeze({
  TOTIVITY_NIGHT_IN_ADDITIONAL_CHILD_FLAT: 'prod_TJvPLmLcl5yU1K',
  TOTIVITY_NIGHT_IN_FIRST_CHILD_FLAT: 'prod_TJvPIvEtUtApt1',
  LATE_FEE_HOURLY: 'prod_TJvP16xOR4eGNc',
  STANDARD_FEE_FIRST_CHILD_HOURLY: 'prod_TJvPHwhljzqv6j',
  STANDARD_FEE_ADDITIONAL_CHILD_HOURLY: 'prod_TJvPhuRQDe2N6F',
  DEALS_SATURDAY_WORKSHOPS_MONTHLY: 'prod_TJvP9xJSO3iDJq',
  DEALS_WEEKDAY_WORKSHOPS_MONTHLY: 'prod_TJvPDgyTVIwIrD',
  DEALS_BIG_SAVER: 'prod_TJvP6cAg8Nttqj',
  DEALS_LITTLE_SAVER: 'prod_TJvPI1qnx7ZfA0',
  DEALS_PARTY_ULTIMATE: 'prod_TJvPZxgiAHwot2',
  DEALS_PARTY_CELEBRATION: 'prod_TJvPqiYwxokEVa',
  DEALS_PARTY_EXPRESS: 'prod_TJvPkYzoh7i5AC',
  TOTIVITY_FUN_SATURDAY_HOURLY: 'prod_TJvPwKDCPOqzqN',
  TOTIVITY_PRE_K_HOURLY: 'prod_TJvPlIf5fzrCyx',
  TOTIVITY_EXPLORERS_HOURLY: 'prod_TJvP6gTKJY3Xhj',
  TOTIVITY_TOT_AND_ME_FLAT: 'prod_TJvPe8aKz0XEyr',
})

export const PAYMENT_PRICING = Object.freeze({
  MINIMUM_HOURS: 2,
  LATE_FEE_THRESHOLD_HOURS: 4,
  MAX_BILLABLE_HOURS: 4,
  GROUP_ACTIVITY_FEE_CENTS: 0
})

// CommonJS compatibility for Cloud Functions (only in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLLECTIONS,
    MIN_RESERVATION_DURATION_MS,
    BUSINESS_HRS,
    ROLES,
    RESERVATION_STATUS,
    DEPOSIT_TYPES,
    GENDERS,
    CONTACT_RELATIONS,
    MIN_AGE_FOR_CHILD_YEARS,
    NOTIFICATION_TYPES,
    INVOICE_STATUS,
    LINE_ITEM_TAGS,
    DISCOUNT_TYPES,
    REFUND_CATEGORIES,
    CREDIT_SOURCES,
    ALERT_TYPES,
    IMAGE_UPLOAD,
    ERROR_MESSAGES,
    LOGGER_ERROR_MESSAGES,
    SERVICE_PRICE_LOOKUP_UIDS,
    PAYMENT_PRICING
  };
} 