import Joi from 'joi';
import { GENDERS, MIN_AGE_FOR_CHILD_YEARS } from '../Helpers/constants';
import { createImageValidation, createPhotoURLValidation } from '../Helpers/validationHelpers.mjs';

function twoYearsAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MIN_AGE_FOR_CHILD_YEARS);
  return date;
}

export const generateChildSchema = (forFormValidation = false) => {
  let schemaFields = {
    // Administrative fields
    archived: Joi.boolean().default(false).required(),
    
    // Child profile fields
    Name: Joi.string().required(),
    DOB: Joi.date()
      .max(twoYearsAgo())
      .required()
      .messages({
        'date.max': `Child must be at least ${MIN_AGE_FOR_CHILD_YEARS} years old.`,
        'date.base': 'Invalid date format. Please use YYYY/MM/DD.'
      }),
    Gender: Joi.string()
      .valid(...Object.values(GENDERS))
      .required(),
    Medications: Joi.string().allow('').optional(),
    Allergies: Joi.string().allow('').optional(),
    Notes: Joi.string().allow('').optional(),
    
    // Photo fields
    PhotoURL: createPhotoURLValidation(),
  };

  // Add Image field only for form validation (transient upload field)
  if (forFormValidation) {
    schemaFields.Image = createImageValidation();
  }

  let schema = Joi.object(schemaFields)
    .prefs({ abortEarly: false })
    .messages({
      'any.required': 'This field is required.',
      'string.empty': 'This field is required.',
    });

  if (forFormValidation) {
    schema = schema.fork(['archived'], (field) => field.forbidden());
  }

  return schema;
} 
