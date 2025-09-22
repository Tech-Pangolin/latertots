import Joi from 'joi';
import { ROLES, IMAGE_UPLOAD } from '../Helpers/constants';
import { DocumentReference } from 'firebase/firestore';

export const generateUserProfileSchema = (forFormValidation = false) => {
  let schemaFields = {
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
  };

  // Add Image field only for form validation (transient upload field)
  if (forFormValidation) {
    schemaFields.Image = Joi.any()
      .custom((value, helpers) => {
        // Handle FileList object (from HTML file input)
        if (value && typeof value === 'object' && value.length !== undefined) {
          // Convert FileList to array for validation
          const files = Array.from(value);
          
          if (files.length > IMAGE_UPLOAD.MAX_FILES_PER_UPLOAD) {
            return helpers.error('custom.maxFiles', { message: 'Only one image can be uploaded at a time.' });
          }
          
          if (files.length === 0) {
            return value; // No file selected, that's okay (optional)
          }
          
          const file = files[0];
          
          // Validate file type
          if (!IMAGE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return helpers.error('custom.invalidType', { message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).' });
          }
          
          // Validate file size
          if (file.size > IMAGE_UPLOAD.MAX_IMAGE_SIZE_BYTES) {
            return helpers.error('custom.fileTooLarge', { message: 'Image file size must be less than 5MB.' });
          }
          
          return value; // File is valid
        }
        
        // If no file selected, that's okay (optional field)
        return value;
      })
      .optional()
      .messages({
        'custom.maxFiles': 'Only one image can be uploaded at a time.',
        'custom.invalidType': 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
        'custom.fileTooLarge': 'Image file size must be less than 5MB.'
      });
  }

  let schema = Joi.object(schemaFields)
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