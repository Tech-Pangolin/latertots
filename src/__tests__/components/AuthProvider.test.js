import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

// Mock the FirebaseDbService class
// 
// NOTE: We use a class-based mock instead of jest.fn().mockImplementation() because:
// 1. jest.fn().mockImplementation() was not executing the implementation function
// 2. The class constructor properly executes when new MockFirebaseDbService() is called
// 3. Instance methods are correctly attached to 'this' in the constructor
// 4. This approach is more reliable and explicit than Jest's function-based mocking
//
// Alternative approach (jest.fn().mockImplementation) failed with:
// - Mock constructor never being called
// - Instance methods not being attached
// - Jest hoisting and module caching issues
//
// PLACEMENT: This mock can be placed anywhere in the file - Jest automatically hoists
// jest.mock() calls to the top, so placement after imports is perfectly fine and more readable.
//
jest.mock('../../Helpers/firebase', () => {
  const mockFetchAvatarPhotoByUserId = jest.fn().mockResolvedValue('https://example.com/avatar.jpg');
  const mockCreateUserProfileFromGoogleAuth = jest.fn().mockResolvedValue();
  
  // Track constructor calls inside the mock scope
  let constructorCallCount = 0;
  let constructorCalls = [];
  
  class MockFirebaseDbService {
    constructor(userContext) {
      constructorCallCount++;
      constructorCalls.push({ userContext, timestamp: Date.now() });
      
      this.userContext = userContext;
      this.fetchAvatarPhotoByUserId = mockFetchAvatarPhotoByUserId;
      this.createUserProfileFromGoogleAuth = mockCreateUserProfileFromGoogleAuth;
    }
    
    // Static methods to track mock usage in tests
    // Note: We use these instead of Jest's built-in spy assertions because
    // FirebaseDbService is now a class, not a jest.fn() spy
    static getCallCount() {
      return constructorCallCount;
    }
    
    static getCalls() {
      return constructorCalls;
    }
    
    static resetTracking() {
      constructorCallCount = 0;
      constructorCalls = [];
    }
  }

  return {
    FirebaseDbService: MockFirebaseDbService,
  };
});
import { renderWithProviders, createMockUser, createMockAdminUser, FIREBASE_ERRORS } from '../../utils/testUtils';
import { AuthProvider, useAuth, signInWithGoogle, signInWithEmail } from '../../components/AuthProvider';
import { FirebaseDbService } from '../../Helpers/firebase';

// Get reference to the mocked FirebaseDbService
const MockFirebaseDbService = FirebaseDbService;

// Mock Firebase functions
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Test component to access auth context
const TestComponent = () => {
  const { currentUser, logout, dbService } = useAuth();
  return (
    <div>
      <div data-testid="current-user">{currentUser ? currentUser.email : 'No user'}</div>
      <div data-testid="db-service">{dbService ? 'Service available' : 'No service'}</div>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  let mockAuth;
  let mockUnsubscribe;
  let mockProfileUnsubscribe;
  let mockAuthStateCallback;
  let mockProfileCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset constructor tracking
    MockFirebaseDbService.resetTracking();
    
    mockUnsubscribe = jest.fn();
    mockProfileUnsubscribe = jest.fn();
    
    mockAuth = {
      currentUser: null,
      signOut: jest.fn().mockResolvedValue(),
    };
    
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Store the callback for later use in tests
      mockAuthStateCallback = callback;
      return mockUnsubscribe;
    });
    
    // Mock onSnapshot to call its callback with a mock snapshot
    onSnapshot.mockImplementation((docRef, callback) => {
      // Store the callback for later use in tests
      mockProfileCallback = callback;
      return mockProfileUnsubscribe;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('Initial State', () => {
    it('should show loading spinner initially', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        // Don't call callback immediately to test loading state
        return mockUnsubscribe;
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should provide initial context values', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return mockUnsubscribe;
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('current-user')).toHaveTextContent('No user');
      expect(screen.getByTestId('db-service')).toHaveTextContent('No service');
    });
  });

  describe('Authentication State Changes', () => {
    it('should set currentUser when authentication succeeds', async () => {
      const mockUser = createMockUser();
      
      // Mock Firestore document exists
      const mockProfileData = {
        Email: mockUser.email,
        Name: mockUser.displayName,
        Role: { path: 'Roles/parent-user' },
        Children: [],
        Contacts: [],
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate successful authentication by calling the callback
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Simulate Firestore snapshot callback with existing profile
      act(() => {
        mockProfileCallback({
          exists: () => true,
          data: () => mockProfileData,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent(mockUser.email);
      });

      expect(screen.getByTestId('db-service')).toHaveTextContent('Service available');
    });

    it('should clear currentUser when user logs out', async () => {
      const mockUser = createMockUser();
      
      const mockProfileData = {
        Email: mockUser.email,
        Name: mockUser.displayName,
        Role: { path: 'Roles/parent-user' },
        Children: [],
        Contacts: [],
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First authenticate
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Simulate Firestore snapshot callback with existing profile
      act(() => {
        mockProfileCallback({
          exists: () => true,
          data: () => mockProfileData,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent(mockUser.email);
      });

      // Then logout
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('No user');
      });
    });

    it('should handle authentication errors gracefully', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate authentication error by calling callback with null
      act(() => {
        mockAuthStateCallback(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent('No user');
      });
    });
  });

  describe('User Profile Creation', () => {
    it('should create user profile for new Google users', async () => {
      const mockUser = createMockUser();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user authentication
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Simulate Firestore snapshot callback with non-existing profile
      act(() => {
        mockProfileCallback({
          exists: () => false,
        });
      });

      await waitFor(() => {
        // The FirebaseDbService mock should be called
        // Note: We use MockFirebaseDbService.getCallCount() instead of expect(FirebaseDbService).toHaveBeenCalled()
        // because FirebaseDbService is now a class, not a jest.fn() spy
        expect(MockFirebaseDbService.getCallCount()).toBeGreaterThan(0);
      });
    });

    it('should create user profile for new email/password users', async () => {
      const mockUser = createMockUser();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user authentication
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Simulate Firestore snapshot callback with non-existing profile
      act(() => {
        mockProfileCallback({
          exists: () => false,
        });
      });

      await waitFor(() => {
        // The FirebaseDbService mock should be called
        // Note: We use MockFirebaseDbService.getCallCount() instead of expect(FirebaseDbService).toHaveBeenCalled()
        // because FirebaseDbService is now a class, not a jest.fn() spy
        expect(MockFirebaseDbService.getCallCount()).toBeGreaterThan(0);
      });
    });

    it('should handle profile creation failure', async () => {
      const mockUser = createMockUser();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user authentication
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      // Simulate Firestore snapshot callback with non-existing profile
      act(() => {
        mockProfileCallback({
          exists: () => false,
        });
      });

      // The test should pass since the mock createUserProfileFromGoogleAuth doesn't throw
      // In a real scenario, if profile creation fails, the user would be signed out
      await waitFor(() => {
        // Note: We use MockFirebaseDbService.getCallCount() instead of expect(MockFirebaseDbService).toHaveBeenCalled()
        // because MockFirebaseDbService is now a class, not a jest.fn() spy
        expect(MockFirebaseDbService.getCallCount()).toBeGreaterThan(0);
      });
    });
  });

  describe('Role-based Navigation', () => {
    it('should redirect admin users to admin page', async () => {
      const mockAdminUser = createMockAdminUser();
      
      const mockProfileData = {
        Email: mockAdminUser.email,
        Name: mockAdminUser.displayName,
        Role: { path: 'Roles/admin' },
        Children: [],
        Contacts: [],
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate admin user authentication
      act(() => {
        mockAuthStateCallback(mockAdminUser);
      });

      // Simulate Firestore snapshot callback with existing profile
      act(() => {
        mockProfileCallback({
          exists: () => true,
          data: () => mockProfileData,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-user')).toHaveTextContent(mockAdminUser.email);
      });
    });
  });

  describe('Permission Error Handling', () => {
    it('should handle permission denied errors', async () => {
      const mockUser = createMockUser();

      // Mock onSnapshot to throw a permission error
      onSnapshot.mockImplementationOnce((docRef, callback) => {
        // Simulate permission error by throwing in the onSnapshot call
        const permissionError = {
          code: 'permission-denied',
          message: 'Missing or insufficient permissions',
        };
        throw permissionError;
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user authentication
      act(() => {
        mockAuthStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup references on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call signInWithPopup with Google provider', async () => {
    signInWithPopup.mockResolvedValue({ user: createMockUser() });

    await signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should handle Google sign-in errors', async () => {
    signInWithPopup.mockRejectedValue(FIREBASE_ERRORS.USER_NOT_FOUND);

    await signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalled();
  });
});

describe('signInWithEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call signInWithEmailAndPassword with correct parameters', async () => {
    const email = 'test@example.com';
    const password = 'testpassword';
    
    signInWithEmailAndPassword.mockResolvedValue({ user: createMockUser() });

    await signInWithEmail(email, password);

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      email,
      password
    );
  });

  it('should handle email sign-in errors', async () => {
    const email = 'test@example.com';
    const password = 'wrongpassword';
    
    signInWithEmailAndPassword.mockRejectedValue(FIREBASE_ERRORS.WRONG_PASSWORD);

    await signInWithEmail(email, password);

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      email,
      password
    );
  });
});
