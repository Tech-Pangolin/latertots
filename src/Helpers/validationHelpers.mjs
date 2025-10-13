import Joi from 'joi';
import { DocumentReference } from 'firebase/firestore';
import { IMAGE_UPLOAD } from './constants.mjs';

/**
 * Custom Joi validation for DocumentReference objects that works with both
 * real DocumentReference instances and Firebase emulator/testing DocumentReferences
 * 
 * Usage:
 * - DocumentReferenceOrCompatible.required() - for required fields
 * - DocumentReferenceOrCompatible.optional().allow(null) - for optional fields
 */
export const DocumentReferenceOrCompatible = Joi.object().custom((value, helpers) => {
  // Allow null for optional DocumentReference fields
  if (value === null) {
    return value;
  }
  
  // Check if it's a real DocumentReference instance
  if (value instanceof DocumentReference) {
    return value;
  }
  
  // Check if it has DocumentReference-like properties (for emulator/testing)
  if (value && typeof value === 'object' && 
      (value.id || value.path || value.firestore || value._delegate)) {
    return value;
  }
  
  return helpers.error('custom.documentReference', {
    message: 'Must be a valid DocumentReference object or null'
  });
}).messages({
  'any.required': 'DocumentReference is required',
  'object.base': 'Must be a valid DocumentReference object'
});

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

export default {
  DocumentReferenceOrCompatible,
  createImageValidation,
  createPhotoURLValidation
};
