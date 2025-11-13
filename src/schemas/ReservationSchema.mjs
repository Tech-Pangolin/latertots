import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants.mjs';
import { Timestamp } from 'firebase/firestore';
import { DocumentReferenceOrCompatible } from '../Helpers/validationHelpers.mjs';


const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  formDraftId: Joi.string().optional(),

  // Billing integration fields
  stripePayments: Joi.object()
    .required()
    .keys({
      minimum: Joi.alternatives().try(Joi.string(), Joi.valid(null)), 
      remainder: Joi.alternatives().try(Joi.string(), Joi.valid(null)),
      full: Joi.alternatives().try(Joi.string(), Joi.valid(null))
    }),
  status: Joi.string()
    .valid(...Object.values(RESERVATION_STATUS))
    .required()
    .messages({
      'any.only': `Status must be one of: ${Object.values(RESERVATION_STATUS).join(', ')}`,
      'string.empty': 'Status is required'
    }),

  // Reservation fields
  start: Joi.object().instance(Timestamp).required().messages({
    'object.instance': 'Start time must be a valid Timestamp object.'
  }),
  end: Joi.object().instance(Timestamp).required().messages({
    'object.instance': 'End time must be a valid Timestamp object.'
  }),
  createdAt: Joi.object().instance(Timestamp).required().messages({
    'object.instance': 'Created time must be a valid Timestamp object.'
  }),
  updatedAt: Joi.object().instance(Timestamp).optional().messages({
    'object.instance': 'Updated time must be a valid Timestamp object.'
  }),
  title: Joi.string().required(),
  childId: Joi.string().required(),
  userId: Joi.string().required(),
  Child: DocumentReferenceOrCompatible.required(),
  User: DocumentReferenceOrCompatible.required(),
  groupActivity: Joi.boolean().default(false).optional(),
  
  // Cancellation fields (no reason needed)
  cancelledAt: Joi.object().instance(Timestamp).optional(),
  
  // Refund fields (reason required when refund is requested)
  refundReason: Joi.string().optional(),
  refundRequestedAt: Joi.object().instance(Timestamp).optional(),
  refundedAt: Joi.object().instance(Timestamp).optional(),
  
  dropOffPickUp: Joi.object({
    pickedUpAt: Joi.object().instance(Timestamp).optional(),
    actualStartTime: Joi.object().instance(Timestamp).optional(),
    actualEndTime: Joi.object().instance(Timestamp).optional(),
    finalCheckoutSessionId: Joi.string().optional(),
    finalCheckoutUrl: Joi.string().optional(),
    finalAmount: Joi.number().optional(),
    calculatedAmount: Joi.number().optional(),
    overrideReason: Joi.string().optional(),
    overrideAppliedAt: Joi.object().instance(Timestamp).optional(),
    overrideAppliedBy: Joi.string().optional(),
    amountPaid: Joi.number().optional(),
    amountRemaining: Joi.number().optional(),
    selectedGroupActivityId: Joi.string().optional()
  }).optional()
})
  .prefs({ abortEarly: false });

export default ReservationSchema;