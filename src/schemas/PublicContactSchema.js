import Joi from 'joi';

export const generatePublicContactSchema = () => {
  return Joi.object({
    name: Joi.string().min(2).required()
      .messages({
        'string.empty': 'Name is required.',
        'string.min': 'Name must be at least 2 characters long.'
      }),
    email: Joi.string().email({ tlds: { allow: false } }).required()
      .messages({
        'string.empty': 'Email is required.',
        'string.email': 'Please provide a valid email address.'
      }),
    subject: Joi.string().min(5).required()
      .messages({
        'string.empty': 'Subject is required.',
        'string.min': 'Subject must be at least 5 characters long.'
      }),
    message: Joi.string().min(10).required()
      .messages({
        'string.empty': 'Message is required.',
        'string.min': 'Message must be at least 10 characters long.'
      })
  }).prefs({ abortEarly: false });
};
