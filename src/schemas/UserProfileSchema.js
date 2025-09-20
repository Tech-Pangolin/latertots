import Joi from 'joi';
import { ROLES } from '../Helpers/constants';
import { DocumentReference } from 'firebase/firestore';

export const generateUserProfileSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    // Administrative fields
    archived: Joi.boolean().default(false).required(),
    paymentHold: Joi.boolean().default(false).required(),

    // Form-set fields
    CellNumber: Joi.string().required(),
    City: Joi.string().required(),
    Email: Joi.string().email({
        tlds: { allow: false }
      }).required(),
    Name: Joi.string().required(),
    Role: Joi.string().valid(...Object.values(ROLES)).required()
      .messages({
      'any.only': "Provided role is not valid."
      }),
    State: Joi.string().default('NC').required(),
    StreetAddress: Joi.string().required()
      .messages({
      'string.empty': 'Street address is required for billing and contact purposes.'
      }),
    Zip: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .required()
      .messages({
      'string.pattern.base': 'Format "12345" or "12345-6789".'
      }),

    // Fields set programmatically
    Children: Joi.array()
      .items(Joi.object().instance(DocumentReference))
      .optional(),
    Contacts: Joi.array()
      .items(Joi.object().instance(DocumentReference))
      .optional(),
    photoURL: Joi.string().uri().optional(),
  })
    .prefs({ abortEarly: false })
    .messages({
      'any.required': 'This field is required.',
      'string.empty': 'This field is required.',
      'string.email': 'Please provide a valid email address.',
      'string.uri': 'Please provide a valid URL for the profile picture.'
    });

  // If this schema is used for form validation, we don't want to allow
  // fields that are not relevant to the form submission.
  if (forFormValidation) {
    schema = schema.fork([
      'archived', 'paymentHold', 'photoURL', 'Children', 'Contacts', 'Role'
    ], (field) => field.forbidden());
  }

  return schema;
} 