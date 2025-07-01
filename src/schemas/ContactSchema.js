import Joi from "joi"
import { CONTACT_RELATIONS } from "../Helpers/constants";
export const generateContactSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    // Administrative fields
    archived: Joi.boolean().default(false).required(),

    // Form-set fields
    Name: Joi.string().min(3).required(),
    Phone: Joi.any()
      .custom((value, helpers) => {
        if (value === '' || value === undefined) return undefined;
        if (typeof value !== 'string') {
          return helpers.error('phone.base');
        }
        const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
        if (!phoneRegex.test(value)) {
          return helpers.error('phone.badFormat');
        }
        return value;
      })
      .optional()
      .messages({
        'phone.base': 'Phone # must be a string.',
        'phone.badFormat': 'Phone # must be in the format "123-456-7890".'
      }),
    Email: Joi.any()
      .custom((value, helpers) => {
        if (value === '' || value === undefined) return undefined;
        if (typeof value !== 'string') {
          return helpers.error('email.base');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return helpers.error('email.badFormat');
        }
        return value;
      })
      .optional()
      .messages({
        'email.base': 'Email must be a string.',
        'email.badFormat': 'Email address format is invalid.'
      }),
    Relation: Joi.string()
      .valid(...Object.values(CONTACT_RELATIONS))
      .required()
      .messages({
        'any.only': "Provided relation is not valid."
      }),
  })
    .or('Phone', 'Email')                                                 // At least one of Phone or Email must be provided
    .messages({
      'object.missing': 'At least one of Phone or Email must be provided.',
    })
    .prefs({ abortEarly: false })


  if (forFormValidation) {
    // If this schema is used for form validation, we don't want to allow
    // fields that are not relevant to the form submission.
    schema = schema.fork(['archived'], (field) => field.forbidden());
  }

  return schema;
}