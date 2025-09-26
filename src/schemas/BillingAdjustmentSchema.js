import Joi from 'joi';
import { Timestamp, DocumentReference } from 'firebase/firestore';
import { 
  BILLING_ADJUSTMENT_TYPES, 
  DISCOUNT_TYPES,
  REFUND_CATEGORIES,
  CREDIT_SOURCES
} from '../Helpers/constants';

// Base fields common to all adjustment types
const BaseAdjustmentFields = {
  adjustmentId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Adjustment ID is required'
    }),
  invoiceId: Joi.object()
    .instance(DocumentReference)
    .required()
    .messages({
      'object.instance': 'Invoice ID must be a valid Firestore DocumentReference'
    }),
  amountCents: Joi.number()
    .integer()
    .required()
    .messages({
      'number.integer': 'Amount must be a whole number (cents)'
    }),
  reason: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reason for adjustment is required'
    }),
  appliedBy: Joi.string()
    .required()
    .messages({
      'string.empty': 'Applied by user ID is required'
    }),
  appliedAt: Joi.object()
    .instance(Timestamp)
    .required()
    .messages({
      'object.instance': 'Applied at must be a valid Firestore Timestamp'
    }),
  // Chain management
  previousAdjustmentId: Joi.string()
    .optional()
    .allow(null)
    .messages({
      'string.empty': 'Previous adjustment ID cannot be empty'
    }),
};

// OverrideAdjustment - Replaces calculated amount entirely
const OverrideAdjustmentSchema = Joi.object({
  ...BaseAdjustmentFields,
  type: Joi.string().valid(BILLING_ADJUSTMENT_TYPES.OVERRIDE).required(),
  // Override-specific fields
  originalSubtotalCents: Joi.number().integer().min(0).required(),
  originalTaxCents: Joi.number().integer().min(0).required(),
  originalTotalCents: Joi.number().integer().min(0).required(),
  overrideSubtotalCents: Joi.number().integer().min(0).required(),
  calculatedTaxCents: Joi.number().integer().min(0).required(),
  calculatedTotalCents: Joi.number().integer().min(0).required()
});

// DiscountAdjustment - Reduces amount by percentage or fixed amount
const DiscountAdjustmentSchema = Joi.object({
  ...BaseAdjustmentFields,
  type: Joi.string().valid(BILLING_ADJUSTMENT_TYPES.DISCOUNT).required(),
  // Discount-specific fields
  discountType: Joi.string().valid(...Object.values(DISCOUNT_TYPES)).required(),
  discountValue: Joi.number().min(0).required(), // percentage (0-100) or fixed amount in cents
  originalAmountCents: Joi.number().integer().min(0).required(),
  discountAmountCents: Joi.number().integer().min(0).required()
});

// RefundAdjustment - Records refund with payment method tracking
const RefundAdjustmentSchema = Joi.object({
  ...BaseAdjustmentFields,
  type: Joi.string().valid(BILLING_ADJUSTMENT_TYPES.REFUND).required(),
  // Refund-specific fields
  refundCategory: Joi.string().valid(...Object.values(REFUND_CATEGORIES)).required(),
  originalPaymentMethod: Joi.string().required(),
  refundMethod: Joi.string().optional(),
  partialRefund: Joi.boolean().default(false),
  refundPercentage: Joi.number().min(0).max(100).optional()
});

// CreditAdjustment - Adds credit with source and expiration
const CreditAdjustmentSchema = Joi.object({
  ...BaseAdjustmentFields,
  type: Joi.string().valid(BILLING_ADJUSTMENT_TYPES.CREDIT).required(),
  // Credit-specific fields
  creditSource: Joi.string().valid(...Object.values(CREDIT_SOURCES)).required(),
  creditExpiration: Joi.object().instance(Timestamp).optional(),
  applicableServices: Joi.array().items(Joi.string()).optional()
});

// Union schema for all adjustment types
const BillingAdjustmentSchema = Joi.alternatives()
  .try(OverrideAdjustmentSchema, DiscountAdjustmentSchema, RefundAdjustmentSchema, CreditAdjustmentSchema)
  .required()
  .messages({
    'alternatives.match': 'Adjustment must be one of: OverrideAdjustment, DiscountAdjustment, RefundAdjustment, or CreditAdjustment'
  });

// Individual schemas for specific use cases
export { OverrideAdjustmentSchema, DiscountAdjustmentSchema, RefundAdjustmentSchema, CreditAdjustmentSchema };

export default BillingAdjustmentSchema;
