import Joi from 'joi';
import { IMAGE_UPLOAD } from './constants';

/**
 * Creates a Joi validation schema for image file uploads
 * Handles FileList objects from HTML file inputs
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether the image is required (default: false)
 * @param {string} options.fieldName - Name of the field for error messages (default: 'Image')
 * @returns {Joi.Schema} Joi schema for image validation
 */
export const createImageValidation = (options = {}) => {
  const { required = false, fieldName = 'Image' } = options;
  
  let schema = Joi.any()
    .custom((value, helpers) => {
      // Handle FileList object (from HTML file input)
      if (value && typeof value === 'object' && value.length !== undefined) {
        // Convert FileList to array for validation
        const files = Array.from(value);
        
        if (files.length > IMAGE_UPLOAD.MAX_FILES_PER_UPLOAD) {
          return helpers.error('custom.maxFiles', { 
            message: 'Only one image can be uploaded at a time.' 
          });
        }
        
        if (files.length === 0) {
          return value; // No file selected, that's okay (optional)
        }
        
        const file = files[0];
        
        // Validate file type
        if (!IMAGE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type)) {
          return helpers.error('custom.invalidType', { 
            message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).' 
          });
        }
        
        // Validate file size
        if (file.size > IMAGE_UPLOAD.MAX_IMAGE_SIZE_BYTES) {
          return helpers.error('custom.fileTooLarge', { 
            message: 'Image file size must be less than 5MB.' 
          });
        }
        
        return value; // File is valid
      }
      
      // If no file selected, that's okay (optional field)
      return value;
    })
    .messages({
      'custom.maxFiles': 'Only one image can be uploaded at a time.',
      'custom.invalidType': 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
      'custom.fileTooLarge': 'Image file size must be less than 5MB.'
    });

  // Make required or optional based on configuration
  if (required) {
    schema = schema.required().messages({
      'any.required': `${fieldName} is required.`
    });
  } else {
    schema = schema.optional();
  }

  return schema;
};

/**
 * Creates a PhotoURL field schema for persistent storage
 * @returns {Joi.Schema} Joi schema for PhotoURL validation
 */
export const createPhotoURLValidation = () => {
  return Joi.string().uri().optional();
};
