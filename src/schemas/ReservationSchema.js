import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants';
import { DocumentReference, Timestamp } from 'firebase/firestore';

const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  billingLocked: Joi.boolean().default(false).required(),
  allDay: Joi.boolean().default(false).required(),                    // TODO: Remove all references to this field
  overrideTotalCents: Joi.number().integer().min(0).optional(),       // Optional field for overriding total billing amount

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
  Child: Joi.object().instance(DocumentReference).required().messages({
    'object.instance': 'Child must be a valid DocumentReference.'
  }),
  User: Joi.object().instance(DocumentReference).required().messages({
    'object.instance': 'User must be a valid DocumentReference.'
  }),
  groupActivity: Joi.boolean().default(false).optional(),
})
  .prefs({ abortEarly: false });

export default ReservationSchema;