import Joi from 'joi';
import { GENDERS } from '../Helpers/constants';

function twoYearsAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 2);
  return date;
}

export const generateChildSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    // Administrative fields
    archived: Joi.boolean().default(false).required(),
    
    // Child profile fields
    Name: Joi.string().required(),
    DOB: Joi.date()
                .max(twoYearsAgo())
                .required()
                .messages({
                  'date.max': 'Child must be at least 2 years old.'
                }),
    Gender: Joi.string()
                .valid(...Object.values(GENDERS))
                .required(),
    Medications: Joi.string().allow('').optional(),
    Allergies: Joi.string().allow('').optional(),
    Notes: Joi.string().allow('').optional(),
  }).prefs({ abortEarly: false })

  if (forFormValidation) {
    schema = schema.fork(['archived'], (field) => field.forbidden());
  }
  return schema;
} 
