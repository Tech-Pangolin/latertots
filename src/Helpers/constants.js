export const COLLECTIONS = {
  CHILDREN: 'Children',
  USERS: 'Users',
  CONTACTS: 'Contacts',
  PERMISSIONS: 'Parent_Authorized_Permissions',
  RESERVATIONS: 'Reservations',
  ROLES: 'Roles',
}

export const MIN_RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const BUSINESS_HRS = {
  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
  startTime: '07:00',
  endTime: '19:00',
  overlap: false
};