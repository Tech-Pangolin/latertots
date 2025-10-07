import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants.mjs';
import { Timestamp } from 'firebase/firestore';
import { DocumentReferenceOrCompatible } from '../Helpers/validationHelpers.mjs';


const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  formDraftId: Joi.string().required(),

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
  title: Joi.string().required(),
  extendedProps: Joi.object({
    status: Joi.string()
      .valid(...Object.values(RESERVATION_STATUS))
      .required(),
    childId: Joi.string().required(),
    duration: Joi.number().min(0).optional(),                           // TODO: Does this field serve a purpose?
  }),
  userId: Joi.string().required(),
  Child: DocumentReferenceOrCompatible.required(),
  User: DocumentReferenceOrCompatible.required(),
  groupActivity: Joi.boolean().default(false).optional(),
  dropOffPickUp: Joi.object({
    droppedOffAt: Joi.object().instance(Timestamp).optional(),
    pickedUpAt: Joi.object().instance(Timestamp).optional(),
    actualStartTime: Joi.object().instance(Timestamp).optional(),
    actualEndTime: Joi.object().instance(Timestamp).optional(),
    servicesProvided: Joi.array().items(Joi.string()).optional(),
    finalCheckoutSessionId: Joi.string().optional(),
    finalCheckoutUrl: Joi.string().optional(),
    finalAmount: Joi.number().optional(),
    amountPaid: Joi.number().optional(),
    amountRemaining: Joi.number().optional()
  }).optional()
})
  .prefs({ abortEarly: false });

export default ReservationSchema;