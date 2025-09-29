import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants.mjs';
import { Timestamp } from 'firebase/firestore';
import { DocumentReferenceOrCompatible } from '../Helpers/validationHelpers.mjs';


const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  allDay: Joi.boolean().default(false).required(),                    // TODO: Remove all references to this field

  // Billing integration fields
  invoice: DocumentReferenceOrCompatible.optional().allow(null),
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
})
  .prefs({ abortEarly: false });

export default ReservationSchema;