// CommonJS version of constants for Cloud Functions
const COLLECTIONS = Object.freeze({
  CHILDREN: 'Children',
  USERS: 'Users',
  CONTACTS: 'Contacts',
  PERMISSIONS: 'Parent_Authorized_Permissions',
  RESERVATIONS: 'Reservations',
  ROLES: 'Roles',
  NOTIFICATIONS: 'Notifications',
  INVOICES: 'Invoices',
  BILLING_ADJUSTMENTS: 'BillingAdjustments',
})

const MIN_RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const BUSINESS_HRS = Object.freeze({
  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
  startTime: '07:00',
  endTime: '19:00',
  overlap: false
})

const ROLES = Object.freeze({
  ADMIN: 'admin',
  PARENT: 'parent-user',
})

const RESERVATION_STATUS = Object.freeze({
  PENDING: 'pending',         // Represents a reservation that is awaiting confirmation by the admin
  CONFIRMED: 'confirmed',     // Represents time between reservation confirmation and service rendered
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

const GENDERS = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  UNSPECIFIED: "Unspecified",
})

const CONTACT_RELATIONS = Object.freeze({
  PARENT: 'Parent',
  FAMILY: 'Family',
  LEGAL_GUARDIAN: 'Legal Guardian',
  FAMILY_FRIEND: 'Family Friend',
  DOCTOR: 'Doctor',
  PROFESSIONAL_CAREGIVER: 'Professional Caregiver',
  OTHER: 'Other',
})

const MIN_AGE_FOR_CHILD_YEARS = 2;

const NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: 'system',
  ADMIN: 'admin',
})

const INVOICE_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
  LATE: 'late',
  REFUNDED: 'refunded'
})

const LINE_ITEM_TAGS = Object.freeze({
  BASE: 'BASE',
  LATE_PICKUP: 'LATE_PICKUP',
  LATE_FEE: 'LATE_FEE'
})

const BILLING_ADJUSTMENT_TYPES = Object.freeze({
  OVERRIDE: 'override',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  CREDIT: 'credit'
})

const BILLING_ADJUSTMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  REVERSED: 'reversed'
})

const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
})

const REFUND_CATEGORIES = Object.freeze({
  CUSTOMER_REQUEST: 'customer_request',
  SERVICE_ISSUE: 'service_issue',
  DUPLICATE_PAYMENT: 'duplicate_payment',
  ADMINISTRATIVE: 'administrative'
})

const CREDIT_SOURCES = Object.freeze({
  GOODWILL: 'goodwill',
  SERVICE_CREDIT: 'service_credit',
  PROMOTIONAL: 'promotional',
  ADMINISTRATIVE: 'administrative'
})

const ALERT_TYPES = Object.freeze({
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'danger', // Semantic 'error' maps to Bootstrap 'danger' class
})

const IMAGE_UPLOAD = Object.freeze({
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_FILES_PER_UPLOAD: 1,
})

const ERROR_MESSAGES = Object.freeze({
  SYSTEM_VALIDATION_FAILURE: 'A problem was detected with your submission.',
  SYSTEM_PROCESSING_ERROR: 'Something went wrong processing your request.',
  SYSTEM_SUBMISSION_ERROR: 'An error occurred while processing your submission.',
})

module.exports = {
  COLLECTIONS,
  MIN_RESERVATION_DURATION_MS,
  BUSINESS_HRS,
  ROLES,
  RESERVATION_STATUS,
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
  ERROR_MESSAGES
};
