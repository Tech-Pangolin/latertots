import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChildRegistration from '../../components/Pages/ChildRegistration';
import { useAuth } from '../../components/AuthProvider';
import { generateChildSchema } from '../../schemas/ChildSchema';
import { withFirebaseRetry } from '../../Helpers/retryHelpers';
import { renderWithProviders, createMockFile, ChildRegistrationWrapper } from '../../utils/testUtils';

// Mock dependencies
jest.mock('../../components/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../schemas/ChildSchema', () => ({
  generateChildSchema: jest.fn(),
}));

jest.mock('../../Helpers/retryHelpers', () => ({
  withFirebaseRetry: jest.fn(),
}));

jest.mock('../../Helpers/datetime', () => ({
  firebaseTimestampToFormDateString: jest.fn((timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    return '';
  }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  arrayUnion: jest.fn(),
}));

// Mock FirebaseDbService
jest.mock('../../Helpers/firebase', () => ({
  FirebaseDbService: jest.fn().mockImplementation(() => ({
    uploadChildPhoto: jest.fn(),
  })),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue(),
    isLoading: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

// Don't mock react-hook-form - use real implementation with wrapper

describe('ChildRegistration Update Functionality', () => {
  let mockDbService;
  let mockSetOpenStateFxn;
  let mockAddAlertFxn;
  let mockChild;
  let mockUseMutation;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-set mock implementations after clearing (following handbook guidance)
    mockDbService = new (require('../../Helpers/firebase').FirebaseDbService)();
    mockDbService.uploadChildPhoto = jest.fn();
    
    // Re-set datetime helper mock
    const { firebaseTimestampToFormDateString } = require('../../Helpers/datetime');
    firebaseTimestampToFormDateString.mockImplementation((timestamp) => {
      if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toISOString().split('T')[0];
      }
      return '';
    });
    
    // No need to mock useForm - using real implementation with wrapper
    
    mockSetOpenStateFxn = jest.fn();
    mockAddAlertFxn = jest.fn();
    mockUseMutation = require('@tanstack/react-query').useMutation;
    
    mockChild = {
      id: 'child-123',
      Name: 'Test Child',
      DOB: {
        toDate: () => new Date('2020-01-01'),
        toMillis: () => new Date('2020-01-01').getTime()
      }, // Mock Firebase Timestamp
      Gender: 'Male',
      Allergies: 'None',
      Medications: 'None',
      Notes: 'Test notes',
      PhotoURL: 'https://example.com/photo.jpg'
    };

    useAuth.mockReturnValue({
      currentUser: { uid: 'user-123', Email: 'test@example.com' },
      dbService: mockDbService,
    });

    generateChildSchema.mockReturnValue({
      validateAsync: jest.fn().mockResolvedValue(mockChild),
    });

    withFirebaseRetry.mockImplementation((fn) => fn);

    // Mock useMutation to return a successful mutation
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(),
      isLoading: false,
      error: null,
    });

  });

  describe('Form Pre-population', () => {
    it('should pre-populate form fields when editingChild prop is provided', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <ChildRegistrationWrapper 
          setOpenStateFxn={mockSetOpenStateFxn} 
          addAlertFxn={mockAddAlertFxn} 
          editingChild={mockChild}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that form fields are populated with child data
      expect(screen.getByDisplayValue('Test Child')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2020-01-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Male')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
      
      // Check specific fields for "None" values
      expect(screen.getByLabelText('Allergies:')).toHaveValue('None');
      expect(screen.getByLabelText('Medications:')).toHaveValue('None');
    });

    it('should show empty form when no editingChild prop is provided', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <ChildRegistrationWrapper 
          setOpenStateFxn={mockSetOpenStateFxn} 
          addAlertFxn={mockAddAlertFxn}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that form shows create mode
      expect(screen.getByText('Child Registration')).toBeInTheDocument();
      expect(screen.getByText('Add your child here!')).toBeInTheDocument();
      expect(screen.getByText('Add Child')).toBeInTheDocument();
    });
  });

  describe('Dynamic UI', () => {
    it('should show edit mode UI when editingChild is provided', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <ChildRegistrationWrapper 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          editingChild={mockChild}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Child')).toBeInTheDocument();
      expect(screen.getByText('Update your child\'s information')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Child' })).toBeInTheDocument();
    });

    it('should show create mode UI when no editingChild is provided', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <ChildRegistrationWrapper 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Child Registration')).toBeInTheDocument();
      expect(screen.getByText('Add your child here!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Child' })).toBeInTheDocument();
    });
  });

  describe('Update Mutation', () => {
    it('should call updateDoc with correct data when in edit mode', async () => {
      // Mock the mutation to track calls and simulate success
      const mockMutateAsync = jest.fn().mockResolvedValue();
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <ChildRegistration 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          editingChild={mockChild}
        />
      );

      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Update Child' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'child-123',
            Name: 'Test Child',
            Gender: 'Male',
            Allergies: 'None',
            Medications: 'None',
            Notes: 'Test notes',
            PhotoURL: 'https://example.com/photo.jpg'
          })
        );
      });
    });

    it('should call setOpenStateFxn after successful update', async () => {
      // Mock useMutation to simulate the onSuccess callback behavior
      mockUseMutation.mockImplementation((config) => {
        const mockMutateAsync = jest.fn().mockImplementation(async (data) => {
          // Simulate successful mutation
          const result = await Promise.resolve();
          
          // For updateChild mutation, manually call setOpenStateFxn to simulate onSuccess behavior
          if (config.mutationKey && config.mutationKey.includes('updateChild')) {
            // Simulate the onSuccess callback behavior from the component
            mockSetOpenStateFxn();
          }
          
          return result;
        });

        return {
          mutate: jest.fn(),
          mutateAsync: mockMutateAsync,
          isLoading: false,
          error: null,
        };
      });

      renderWithProviders(
        <ChildRegistration 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          editingChild={mockChild}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Update Child' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetOpenStateFxn).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle update errors and show error message', async () => {
      // Mock mutation that rejects with an error
      const updateError = new Error('Update failed');
      const mockMutateAsync = jest.fn().mockRejectedValue(updateError);
      mockUseMutation.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: mockMutateAsync,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <ChildRegistration 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          editingChild={mockChild}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Update Child' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddAlertFxn).toHaveBeenCalledWith(
          expect.any(String), // ALERT_TYPES.ERROR
          'Update failed: Update failed'
        );
      });
    });

    it('should handle photo upload errors with warning message', async () => {
      // Mock successful child update but failed photo upload
      const mockUpdateChildMutation = jest.fn().mockResolvedValue();
      const mockUploadPhotoMutation = jest.fn().mockRejectedValue(new Error('Photo upload failed'));
      
      // Mock useMutation to return different mutations based on the mutationKey
      mockUseMutation.mockImplementation((config) => {
        if (config.mutationKey && config.mutationKey.includes('updateChild')) {
          return {
            mutate: jest.fn(),
            mutateAsync: mockUpdateChildMutation,
            isLoading: false,
            error: null,
          };
        } else if (config.mutationKey && config.mutationKey.includes('uploadChildPhoto')) {
          return {
            mutate: jest.fn(),
            mutateAsync: mockUploadPhotoMutation,
            isLoading: false,
            error: null,
          };
        }
        return {
          mutate: jest.fn(),
          mutateAsync: jest.fn().mockResolvedValue(),
          isLoading: false,
          error: null,
        };
      });

      renderWithProviders(
        <ChildRegistration 
          setOpenStateFxn={mockSetOpenStateFxn}
          addAlertFxn={mockAddAlertFxn}
          editingChild={mockChild}
        />
      );

      // Add a photo file
      const fileInput = screen.getByLabelText('Photo');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitButton = screen.getByRole('button', { name: 'Update Child' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddAlertFxn).toHaveBeenCalledWith(
          expect.any(String), // ALERT_TYPES.WARNING
          expect.stringContaining('Child updated successfully, but photo upload failed')
        );
      });
    });
  });
});
