import { generateUserProfileSchema } from '../../schemas/UserProfileSchema';
import { ROLES } from '../../Helpers/constants';

describe('UserProfileSchema', () => {
  const validUserData = {
    Name: 'John Doe',
    Email: 'john.doe@example.com',
    CellNumber: '123-456-7890',
    StreetAddress: '123 Main St',
    City: 'Raleigh',
    State: 'NC',
    Zip: '27601',
    Role: ROLES.PARENT,
    archived: false,
    paymentHold: false,
  };

  const validUserDataWithOptional = {
    ...validUserData,
    Children: [],
    Contacts: [],
    photoURL: 'https://example.com/photo.jpg',
  };

  describe('Required Fields Validation', () => {
    it('should validate required fields (Name, Email, etc.)', async () => {
      const schema = generateUserProfileSchema();
      const result = await schema.validateAsync(validUserData);
      
      expect(result.Name).toBe('John Doe');
      expect(result.Email).toBe('john.doe@example.com');
      expect(result.CellNumber).toBe('123-456-7890');
      expect(result.StreetAddress).toBe('123 Main St');
      expect(result.City).toBe('Raleigh');
      expect(result.State).toBe('NC');
      expect(result.Zip).toBe('27601');
      expect(result.Role).toBe(ROLES.PARENT);
    });

    it('should reject missing Name field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.Name;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing Email field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.Email;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing CellNumber field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.CellNumber;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing StreetAddress field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.StreetAddress;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing City field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.City;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing State field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.State;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing Zip field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.Zip;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });

    it('should reject missing Role field', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData };
      delete invalidData.Role;

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', async () => {
      const schema = generateUserProfileSchema();
      const result = await schema.validateAsync(validUserData);
      
      expect(result.Email).toBe('john.doe@example.com');
    });

    it('should reject invalid email format', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Email: 'invalid-email' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email without domain', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Email: 'user@' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email without @ symbol', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Email: 'userexample.com' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject empty email', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Email: '' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });
  });

  describe('Zip Code Validation', () => {
    it('should validate 5-digit zip code format', async () => {
      const schema = generateUserProfileSchema();
      const result = await schema.validateAsync(validUserData);
      
      expect(result.Zip).toBe('27601');
    });

    it('should validate 9-digit zip code format (12345-6789)', async () => {
      const schema = generateUserProfileSchema();
      const dataWithExtendedZip = { ...validUserData, Zip: '27601-1234' };
      const result = await schema.validateAsync(dataWithExtendedZip);
      
      expect(result.Zip).toBe('27601-1234');
    });

    it('should reject invalid zip code format', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Zip: '1234' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Format "12345" or "12345-6789"');
    });

    it('should reject zip code with letters', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Zip: 'abcde' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Format "12345" or "12345-6789"');
    });

    it('should reject zip code with wrong hyphen format', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Zip: '27601-123' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Format "12345" or "12345-6789"');
    });

    it('should reject empty zip code', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Zip: '' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('This field is required');
    });
  });

  describe('Role Validation', () => {
    it('should validate role values against ROLES constant', async () => {
      const schema = generateUserProfileSchema();
      
      // Test parent role
      const parentData = { ...validUserData, Role: ROLES.PARENT };
      const parentResult = await schema.validateAsync(parentData);
      expect(parentResult.Role).toBe(ROLES.PARENT);

      // Test admin role
      const adminData = { ...validUserData, Role: ROLES.ADMIN };
      const adminResult = await schema.validateAsync(adminData);
      expect(adminResult.Role).toBe(ROLES.ADMIN);
    });

    it('should reject invalid role values', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Role: 'invalid-role' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Provided role is not valid');
    });

    it('should reject empty role', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Role: '' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Provided role is not valid');
    });
  });

  describe('Optional Fields', () => {
    it('should allow optional fields (Children, Contacts, photoURL)', async () => {
      const schema = generateUserProfileSchema();
      const result = await schema.validateAsync(validUserDataWithOptional);
      
      expect(result.Children).toEqual([]);
      expect(result.Contacts).toEqual([]);
      expect(result.photoURL).toBe('https://example.com/photo.jpg');
    });

    it('should work without optional fields', async () => {
      const schema = generateUserProfileSchema();
      const result = await schema.validateAsync(validUserData);
      
      expect(result.Children).toBeUndefined();
      expect(result.Contacts).toBeUndefined();
      expect(result.photoURL).toBeUndefined();
    });

    it('should validate photoURL format when provided', async () => {
      const schema = generateUserProfileSchema();
      const dataWithPhoto = { ...validUserData, photoURL: 'https://example.com/photo.jpg' };
      const result = await schema.validateAsync(dataWithPhoto);
      
      expect(result.photoURL).toBe('https://example.com/photo.jpg');
    });

    it('should reject invalid photoURL format', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, photoURL: 'not-a-url' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Please provide a valid URL for the profile picture');
    });
  });

  describe('Data Type Validation', () => {
    it('should reject invalid data types', async () => {
      const schema = generateUserProfileSchema();
      
      // Test with wrong types
      const invalidData = {
        Name: 123, // Should be string
        Email: 'test@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('"Name" must be a string');
    });

    it('should reject boolean fields with wrong types', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, archived: 'not-boolean' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('"archived" must be a boolean');
    });

    it('should reject array fields with wrong types', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Children: 'not-array' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('"Children" must be an array');
    });
  });

  describe('Form Validation Mode', () => {
    it('should handle form validation mode correctly', async () => {
      const schema = generateUserProfileSchema(true); // forFormValidation = true
      const formData = {
        Name: 'John Doe',
        Email: 'john.doe@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: 'parent-user',
      };

      const result = await schema.validateAsync(formData);
      
      expect(result.Name).toBe('John Doe');
      expect(result.Email).toBe('john.doe@example.com');
      expect(result.archived).toBe(false);
      expect(result.paymentHold).toBe(false);
      expect(result.photoURL).toBeUndefined();
      expect(result.Children).toBeUndefined();
      expect(result.Contacts).toBeUndefined();
    });

    it('should reject forbidden fields in form validation mode', async () => {
      const schema = generateUserProfileSchema(true); // forFormValidation = true
      const formDataWithForbidden = {
        Name: 'John Doe',
        Email: 'john.doe@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        archived: false, // This should be forbidden
        photoURL: 'https://example.com/photo.jpg', // This should be forbidden
      };

      await expect(schema.validateAsync(formDataWithForbidden)).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should accept explicit default values for archived and paymentHold', async () => {
      const schema = generateUserProfileSchema();
      const dataWithDefaults = {
        Name: 'John Doe',
        Email: 'john.doe@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      const result = await schema.validateAsync(dataWithDefaults);
      
      expect(result.archived).toBe(false);
      expect(result.paymentHold).toBe(false);
    });

    it('should accept explicit default value for State', async () => {
      const schema = generateUserProfileSchema();
      const dataWithState = {
        Name: 'John Doe',
        Email: 'john.doe@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      const result = await schema.validateAsync(dataWithState);
      
      expect(result.State).toBe('NC');
    });
  });

  describe('Custom Error Messages', () => {
    it('should show custom error message for StreetAddress', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, StreetAddress: '' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Street address is required for billing and contact purposes');
    });

    it('should show custom error message for Role', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Role: 'invalid' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Provided role is not valid');
    });

    it('should show custom error message for Zip pattern', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, Zip: '1234' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Format "12345" or "12345-6789"');
    });

    it('should show custom error message for photoURL', async () => {
      const schema = generateUserProfileSchema();
      const invalidData = { ...validUserData, photoURL: 'invalid-url' };

      await expect(schema.validateAsync(invalidData)).rejects.toThrow('Please provide a valid URL for the profile picture');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', async () => {
      const schema = generateUserProfileSchema();
      const dataWithEmptyStrings = {
        Name: '',
        Email: 'test@example.com',
        CellNumber: '',
        StreetAddress: '',
        City: '',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      await expect(schema.validateAsync(dataWithEmptyStrings)).rejects.toThrow();
    });

    it('should handle null values', async () => {
      const schema = generateUserProfileSchema();
      const dataWithNulls = {
        Name: null,
        Email: 'test@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      await expect(schema.validateAsync(dataWithNulls)).rejects.toThrow();
    });

    it('should handle undefined values', async () => {
      const schema = generateUserProfileSchema();
      const dataWithUndefined = {
        Name: undefined,
        Email: 'test@example.com',
        CellNumber: '123-456-7890',
        StreetAddress: '123 Main St',
        City: 'Raleigh',
        State: 'NC',
        Zip: '27601',
        Role: ROLES.PARENT,
        archived: false,
        paymentHold: false,
      };

      await expect(schema.validateAsync(dataWithUndefined)).rejects.toThrow();
    });
  });
});
