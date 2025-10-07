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
  BILLING_ADJUSTMENTS: 'BillingAdjustments',
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

  // The following statuses are used for billing purposes

  PROCESSING: 'processing',   // Represents time between rendered service and invoice creation
  UNPAID: 'unpaid',
  PAID: 'paid',
  LATE: 'late',
  REFUNDED: 'refunded',       // Payment was received but later refunded
  COMPED: 'comped',           // Payment was waived, no fees apply
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
  LATE_FEE: 'LATE_FEE'
})

export const BILLING_ADJUSTMENT_TYPES = Object.freeze({
  OVERRIDE: 'override',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  CREDIT: 'credit'
})

export const BILLING_ADJUSTMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  REVERSED: 'reversed'
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

export const SERVICE_PRICE_LOOKUP_UIDS = Object.freeze({
  TOTIVITY_NIGHT_IN_ADDITIONAL_CHILD_FLAT: 'prod_TAc8LkawAJmG3b',
  TOTIVITY_NIGHT_IN_FIRST_CHILD_FLAT: 'prod_TAbA653bZmWGWo',
  LATE_FEE_HOURLY: 'prod_TAc2CxkqCnOXRd',
  STANDARD_FEE_FIRST_CHILD_HOURLY: 'prod_TAb5YS29FcZ4N4',
  STANDARD_FEE_ADDITIONAL_CHILD_HOURLY: 'prod_TAbNO8kRNTWYDy',
  DEALS_SATURDAY_WORKSHOPS_MONTHLY: 'prod_TAbgVKaXG3OWst',
  DEALS_WEEKDAY_WORKSHOPS_MONTHLY: 'prod_TAbbYn4KgpqMXn',
  DEALS_BIG_SAVER: 'prod_TAbTS3BnkYIUqe',
  DEALS_LITTLE_SAVER: 'prod_TAbSlZJgrVKdnW',
  DEALS_PARTY_ULTIMATE: 'prod_TAbKQEZC23Jieb',
  DEALS_PARTY_CELEBRATION: 'prod_TAbJYrUDzvEAKM',
  DEALS_PARTY_EXPRESS: 'prod_TAbILXTre9dqi9',
  TOTIVITY_FUN_SATURDAY_HOURLY: 'prod_TAbHOJsTmasu0q',
  TOTIVITY_PRE_K_HOURLY: 'prod_TAbG1y3F5tNhnK',
  TOTIVITY_EXPLORERS_HOURLY: 'prod_TAbFDQSJWCsOC3',
  TOTIVITY_TOT_AND_ME_FLAT: 'prod_TAbCsynUPM6BBP',
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
    BILLING_ADJUSTMENT_TYPES,
    BILLING_ADJUSTMENT_STATUS,
    DISCOUNT_TYPES,
    REFUND_CATEGORIES,
    CREDIT_SOURCES,
    ALERT_TYPES,
    IMAGE_UPLOAD,
    ERROR_MESSAGES,
    SERVICE_PRICE_LOOKUP_UIDS
  };
} 