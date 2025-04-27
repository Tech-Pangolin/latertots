// billing-config.js

/**
 * Central pricing & credit‑control knobs.
 * Edit these values – no compile‑time changes needed elsewhere.
 * All monetary values are stored as CENTS to avoid rounding errors.
 */
export const billingConfig = {
  /* ---------- pricing ---------- */
  baseRateCentsPerHour: 1500,   // $15 / h
  dailyCapReservationHours: 4,  // 4h maximum reservation
  minBillableMinutes: 120,      // 2h minimum
  maxBillableMinutes: null,        // set max billable mins here
  pickupGracePeriodMinutes: 5,
  billToNearestMinutes: 15,
  latePickupThresholdHours: 4.08,  // update this value when grace period is changed

  serviceAddOns: {
    LATE_PICKUP_FEE:  500,        // +$5 flat
  },

  /* ---------- tax ---------- */
  taxRateDecimal: 0.0675,           // simple sales tax

  /* ---------- credit control ---------- */
  maxAllowedUnpaid: 3,        // invoices (‘unpaid’ + ‘late’)

  /* ---------- late fee ---------- */
  lateFee: {
    flatCents: 1000,          // single $10 fee
    lineItemLabel: 'Late fee',
  }
};
