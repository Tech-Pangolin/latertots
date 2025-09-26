import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants.mjs';
import { DocumentReference, Timestamp } from 'firebase/firestore';


const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  allDay: Joi.boolean().default(false).required(),                    // TODO: Remove all references to this field

  // Billing integration fields
  invoice: Joi.object().custom((value, helpers) => {
    // Allow null for unbilled reservations
    if (value === null) {
      return value;
    }
    // Check if it has DocumentReference-like properties
    if (value && typeof value === 'object' && 
        (value.id || value.path || value.firestore || value._delegate)) {
      return value;
    }
    return helpers.error('custom.documentReference', {
      message: 'Invoice must be a valid DocumentReference object or null'
    });
  }).optional().allow(null).messages({
    'any.required': 'Invoice DocumentReference is required when provided'
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
  Child: Joi.object().custom((value, helpers) => {
    // Check if it has DocumentReference-like properties
    if (value && typeof value === 'object' && 
        (value.id || value.path || value.firestore || value._delegate)) {
      return value;
    }
    return helpers.error('custom.documentReference', {
      message: 'Child must be a valid DocumentReference object'
    });
  }).required().messages({
    'any.required': 'Child DocumentReference is required'
  }),
  User: Joi.object().custom((value, helpers) => {
    // Check if it has DocumentReference-like properties
    if (value && typeof value === 'object' && 
        (value.id || value.path || value.firestore || value._delegate)) {
      return value;
    }
    return helpers.error('custom.documentReference', {
      message: 'User must be a valid DocumentReference object'
    });
  }).required().messages({
    'any.required': 'User DocumentReference is required'
  }),
  groupActivity: Joi.boolean().default(false).optional(),
})
  .prefs({ abortEarly: false });

export default ReservationSchema;