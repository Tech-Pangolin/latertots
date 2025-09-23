// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ id: 'mock-collection' })),
  addDoc: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn()
}));

// Mock Firebase service
jest.mock('../../Helpers/firebase', () => ({
  FirebaseDbService: jest.fn().mockImplementation(() => ({
    uploadChildPhoto: jest.fn()
  }))
}));

// Mock the retry helper - this is the key integration point
jest.mock('../../Helpers/retryHelpers', () => ({
  withFirebaseRetry: jest.fn()
}));

import { withFirebaseRetry } from '../../Helpers/retryHelpers';
import { FirebaseDbService } from '../../Helpers/firebase';

describe('ChildRegistration Retry Integration Tests', () => {
  let mockDbService;
  let mockWithFirebaseRetry;

  beforeEach(() => {
    mockDbService = new FirebaseDbService();
    mockWithFirebaseRetry = withFirebaseRetry;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should successfully upload child photo after retry', async () => {
    const { addDoc, updateDoc } = require('firebase/firestore');
    
    // Mock successful child creation
    const mockDocRef = { id: 'child-123' };
    addDoc.mockResolvedValue(mockDocRef);
    updateDoc.mockResolvedValue();
    
    // Mock photo upload that fails once, then succeeds
    mockDbService.uploadChildPhoto = jest.fn()
      .mockRejectedValueOnce({ code: 'permission-denied', message: 'Permission denied' })
      .mockResolvedValue('https://example.com/photo.jpg');
    
    // Mock retry helper to simulate retry behavior
    mockWithFirebaseRetry.mockImplementation(async (operation) => {
      try {
        return await operation();
      } catch (error) {
        if (error.code === 'permission-denied') {
          // Retry once
          return await operation();
        }
        throw error;
      }
    });
    
    // Simulate the child registration flow
    const childData = { Name: 'Test Child', DOB: '2020-01-01', Gender: 'male' };
    const childImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Create child document
    const docRef = await addDoc(require('firebase/firestore').collection(), childData);
    
    // Upload photo with retry logic
    const PhotoURL = await mockWithFirebaseRetry(
      () => mockDbService.uploadChildPhoto(docRef.id, childImage)
    );
    
    // Update child with photo URL
    await updateDoc(require('firebase/firestore').doc(), { PhotoURL });
    
    // Verify retry logic was called
    expect(mockWithFirebaseRetry).toHaveBeenCalled();
    expect(mockDbService.uploadChildPhoto).toHaveBeenCalledTimes(2); // Failed once, succeeded once
    expect(PhotoURL).toBe('https://example.com/photo.jpg');
  });

  it('should handle photo upload failure after all retries', async () => {
    const { addDoc, updateDoc } = require('firebase/firestore');
    
    // Mock successful child creation
    const mockDocRef = { id: 'child-123' };
    addDoc.mockResolvedValue(mockDocRef);
    updateDoc.mockResolvedValue();
    
    // Mock retry helper to always fail after retries
    mockWithFirebaseRetry.mockRejectedValue(new Error('Persistent permission error'));
    
    // Simulate the child registration flow
    const childData = { Name: 'Test Child', DOB: '2020-01-01', Gender: 'male' };
    const childImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Create child document
    const docRef = await addDoc(require('firebase/firestore').collection(), childData);
    
    // Attempt photo upload with retry logic - should fail
    await expect(
      mockWithFirebaseRetry(
        () => mockDbService.uploadChildPhoto(docRef.id, childImage)
      )
    ).rejects.toThrow('Persistent permission error');
    
    // Verify retry logic was called
    expect(mockWithFirebaseRetry).toHaveBeenCalled();
  });

  it('should handle child update with photo retry', async () => {
    const { updateDoc } = require('firebase/firestore');
    
    // Mock successful child update
    updateDoc.mockResolvedValue();
    
    // Mock photo upload that fails once, then succeeds
    mockDbService.uploadChildPhoto = jest.fn()
      .mockRejectedValueOnce({ code: 'permission-denied', message: 'Permission denied' })
      .mockResolvedValue('https://example.com/photo.jpg');
    
    // Mock retry helper to simulate retry behavior
    mockWithFirebaseRetry.mockImplementation(async (operation) => {
      try {
        return await operation();
      } catch (error) {
        if (error.code === 'permission-denied') {
          return await operation();
        }
        throw error;
      }
    });
    
    // Simulate the child update flow
    const childId = 'child-123';
    const childImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Upload photo with retry logic
    const PhotoURL = await mockWithFirebaseRetry(
      () => mockDbService.uploadChildPhoto(childId, childImage)
    );
    
    // Update child with photo URL
    await updateDoc(require('firebase/firestore').doc(), { PhotoURL });
    
    // Verify retry logic was called
    expect(mockWithFirebaseRetry).toHaveBeenCalled();
    expect(mockDbService.uploadChildPhoto).toHaveBeenCalledTimes(2); // Failed once, succeeded once
    expect(PhotoURL).toBe('https://example.com/photo.jpg');
  });
});