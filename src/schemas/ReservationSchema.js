import Joi from 'joi';
import { RESERVATION_STATUS } from '../Helpers/constants';
import { DocumentReference } from 'firebase/firestore';

const ReservationSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().default(false).required(),
  billingLocked: Joi.boolean().required(),
  allDay: Joi.boolean().required(),
  overrideTotalCents: Joi.number().integer().min(0).optional(),       // Optional field for overriding total billing amount
  
  // Reservation fields
  start: Joi.date().required(),
  end: Joi.date().required(),
  title: Joi.string().required(),
  extendedProps: Joi.object({
    status: Joi.string()
                .valid(...Object.values(RESERVATION_STATUS))
                .required(),
    childId: Joi.string().required(),
  }),
  userId: Joi.string().required(),
  Child: Joi.object().instance(DocumentReference).required(),
  User: Joi.object().instance(DocumentReference).required(),
})