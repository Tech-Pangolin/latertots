export const COLLECTIONS = Object.freeze({
  CHILDREN: 'Children',
  USERS: 'Users',
  CONTACTS: 'Contacts',
  PERMISSIONS: 'Parent_Authorized_Permissions',
  RESERVATIONS: 'Reservations',
  ROLES: 'Roles',
  NOTIFICATIONS: 'Notifications',
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

export const MIN_AGE_FOR_CHILD_YEARS = 2;

export const NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: 'system',
  ADMIN: 'admin',
}) 