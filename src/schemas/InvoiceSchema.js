import Joi from 'joi';
import { Timestamp, DocumentReference } from 'firebase/firestore';
import { INVOICE_STATUS, LINE_ITEM_TAGS } from '../Helpers/constants';
import { BillingAdjustmentSchema } from './BillingAdjustmentSchema';

const LineItemSchema = Joi.object({
  tag: Joi.string()
    .valid(...Object.values(LINE_ITEM_TAGS))
    .required()
    .messages({
      'any.only': 'Line item tag must be one of the following: ' + Object.values(LINE_ITEM_TAGS).join(', ')
    }),
  service: Joi.string()
    .required()
    .messages({
      'string.empty': 'Service description is required'
    }),
  durationHours: Joi.number()
    .min(0)
    .max(24)
    .required()
    .messages({
      'number.min': 'Duration must be 0 or greater',
      'number.max': 'Duration cannot exceed 24 hours'
    }),
  rateCentsPerHour: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Rate must be a whole number (cents)',
      'number.min': 'Rate must be 0 or greater'
    }),
  subtotalCents: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Subtotal must be a whole number (cents)',
      'number.min': 'Subtotal must be 0 or greater'
    })
}).custom((value, helpers) => {
  // Validate business rule: subtotal = duration * rate
  const expectedSubtotal = Math.round(value.durationHours * value.rateCentsPerHour);
  if (value.subtotalCents !== expectedSubtotal) {
    return helpers.error('custom.businessRule', {
      message: `Subtotal (${value.subtotalCents}) must equal duration (${value.durationHours}) × rate (${value.rateCentsPerHour}) = ${expectedSubtotal}`
    });
  }
  return value;
}, 'Business rule validation');

const InvoiceSchema = Joi.object({
  invoiceId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Invoice ID is required'
    }),
  reservationId: Joi.object()
    .instance(DocumentReference)
    .required()
    .messages({
      'object.instance': 'Reservation ID must be a valid Firestore DocumentReference'
    }),
  date: Joi.object()
    .instance(Timestamp)
    .required()
    .messages({
      'object.instance': 'Date must be a valid Firestore Timestamp'
    }),
  dueDate: Joi.object()
    .instance(Timestamp)
    .required()
    .messages({
      'object.instance': 'Due date must be a valid Firestore Timestamp'
    }),
  user: Joi.object({
    id: Joi.string()
      .required()
      .messages({
        'string.empty': 'User ID is required'
      }),
    name: Joi.string()
      .required()
      .messages({
        'string.empty': 'User name is required'
      }),
    phone: Joi.string()
      .required()
      .messages({
        'string.empty': 'User phone is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'User email must be a valid email address',
        'string.empty': 'User email is required'
      })
  }).required(),
  lineItems: Joi.array()
    .items(LineItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one line item is required'
    }),
  subtotalCents: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Subtotal must be a whole number (cents)',
      'number.min': 'Subtotal must be 0 or greater'
    }),
  taxCents: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Tax must be a whole number (cents)',
      'number.min': 'Tax must be 0 or greater'
    }),
  totalCents: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Total must be a whole number (cents)',
      'number.min': 'Total must be 0 or greater'
    }),
  status: Joi.string()
    .valid(...Object.values(INVOICE_STATUS))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(INVOICE_STATUS).join(', ')}`
    }),
  // Billing adjustments for this invoice
  adjustments: Joi.array()
    .items(BillingAdjustmentSchema)
    .default([])
    .messages({
      'array.items': 'Each adjustment must be a valid BillingAdjustment'
    })
}).custom((value, helpers) => {
  // Validate business rule: total = subtotal + tax (before adjustments)
  const expectedTotal = value.subtotalCents + value.taxCents;
  if (value.totalCents !== expectedTotal) {
    return helpers.error('custom.businessRule', {
      message: `Total (${value.totalCents}) must equal subtotal (${value.subtotalCents}) + tax (${value.taxCents}) = ${expectedTotal}`
    });
  }
  
  // Validate adjustments: each adjustment must reference this invoice
  if (value.adjustments && value.adjustments.length > 0) {
    for (const adjustment of value.adjustments) {
      if (adjustment.invoiceId !== value.invoiceId) {
        return helpers.error('custom.adjustmentMismatch', {
          message: `Adjustment invoice ID (${adjustment.invoiceId}) must match invoice ID (${value.invoiceId})`
        });
      }
    }
  }
  
  return value;
}, 'Business rule validation')
.prefs({ abortEarly: false });

export default InvoiceSchema;
