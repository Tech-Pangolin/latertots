import Joi from 'joi';
import { ROLES } from '../Helpers/constants';
import { DocumentReference } from 'firebase/firestore';

const UserProfileSchema = Joi.object({
  // Administrative fields
  archived: Joi.boolean().required(),
  paymentHold: Joi.boolean().required(),

  // User profile fields
  CellNumber: Joi.string().required(),
  City: Joi.string().required(),
  Email: Joi.string().email().required(),
  Name: Joi.string().required(),
  Role: Joi.string().valid(...Object.values(ROLES)).required(),
  State: Joi.string().required(),
  StreetAddress: Joi.string().required(),
  Zip: Joi.string().required(),

  // Optional fields
  Children: Joi.array()
                .items(Joi.object().instance(DocumentReference))
                .optional(),
  Contacts: Joi.array()
                .items(Joi.object().instance(DocumentReference))
                .optional(),
  // ProfilePhoto field goes here and is a URL
})