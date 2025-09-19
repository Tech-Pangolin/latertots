import Joi from 'joi';

export const generatePasswordSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Current password is required.',
        'string.empty': 'Current password is required.'
      }),
    newPassword: Joi.string().min(8).required()
      .messages({
        'any.required': 'New password is required.',
        'string.empty': 'New password is required.',
        'string.min': 'Password must be at least 8 characters long.'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.required': 'Please confirm your new password.',
        'any.only': 'Passwords do not match.'
      })
  })
  .prefs({ abortEarly: false });

  return schema;
};

export const generateForgotPasswordSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    email: Joi.string().email({
      tlds: { allow: false }
    }).required()
    .messages({
      'any.required': 'Email address is required.',
      'string.empty': 'Email address is required.',
      'string.email': 'Please provide a valid email address.'
    })
  })
  .prefs({ abortEarly: false });

  return schema;
};

export const generateResetPasswordSchema = (forFormValidation = false) => {
  let schema = Joi.object({
    newPassword: Joi.string().min(8).required()
      .messages({
        'any.required': 'New password is required.',
        'string.empty': 'New password is required.',
        'string.min': 'Password must be at least 8 characters long.'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.required': 'Please confirm your new password.',
        'any.only': 'Passwords do not match.'
      })
  })
  .prefs({ abortEarly: false });

  return schema;
};
