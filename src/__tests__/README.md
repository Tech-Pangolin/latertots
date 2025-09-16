# Authentication Test Suite

This directory contains comprehensive tests for the authentication system of the LaterTots application.

## Test Structure

```
src/__tests__/
├── setupTests.js              # Global test setup and mocks
├── utils/
│   └── testUtils.js           # Test utilities and helpers
├── components/
│   ├── AuthProvider.test.js   # AuthProvider component tests
│   ├── LoginPage.test.js      # LoginPage component tests
│   └── UserForm.test.js       # UserForm component tests
├── services/
│   └── FirebaseDbService.test.js # Firebase service tests
├── schemas/
│   └── UserProfileSchema.test.js # Schema validation tests
├── integration/
│   └── AuthFlow.test.js       # End-to-end authentication flow tests
├── security/
│   └── AuthSecurity.test.js   # Security and error handling tests
└── jest.config.js             # Jest configuration
```

## Test Categories

### 1. Unit Tests
- **AuthProvider**: Authentication state management
- **LoginPage**: Login form functionality
- **UserForm**: Registration and profile update forms
- **FirebaseDbService**: Database operations and user management
- **UserProfileSchema**: Data validation and schema enforcement

### 2. Integration Tests
- **AuthFlow**: Complete user authentication journeys
- Cross-component communication
- Firebase service integration

### 3. Security Tests
- Input validation and sanitization
- Permission-based access control
- Error handling and information disclosure prevention
- Session management and token handling

## Running Tests

### All Tests
```bash
npm test
```

### Authentication Tests Only
```bash
npm run test:auth
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Coverage

The test suite covers:

- ✅ User registration (email/password and Google OAuth)
- ✅ User login (email/password and Google OAuth)
- ✅ Profile creation and updates
- ✅ Role-based access control
- ✅ Form validation and error handling
- ✅ Security vulnerabilities prevention
- ✅ Firebase service integration
- ✅ Authentication state management
- ✅ Navigation and routing
- ✅ File upload functionality

## Mock Strategy

### Firebase Services
- Firebase Auth methods are mocked to simulate authentication flows
- Firestore operations are mocked to test database interactions
- Firebase Storage is mocked for file upload testing

### External Dependencies
- React Router is mocked for navigation testing
- React Hook Form is mocked for form validation testing
- TanStack Query is mocked for mutation testing

### Test Data
- Consistent mock user objects for different roles
- Standardized error objects for testing error scenarios
- Form data factories for testing various input combinations

## Key Test Utilities

### `createMockUser(overrides)`
Creates a standardized mock user object with optional overrides.

### `createMockAdminUser(overrides)`
Creates a mock admin user object.

### `createMockFormData(overrides)`
Creates mock form data for testing form submissions.

### `renderWithProviders(ui, options)`
Custom render function that includes necessary providers (Router, etc.).

### `FIREBASE_ERRORS`
Predefined Firebase error objects for consistent error testing.

## Security Testing

The security tests ensure:

1. **Data Protection**: Sensitive information is not exposed in client state
2. **Input Validation**: Malicious input is properly sanitized
3. **Access Control**: Role-based permissions are enforced
4. **Error Handling**: Internal system information is not leaked
5. **Session Management**: Authentication tokens are handled securely

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on external state
2. **Mocking**: External dependencies are properly mocked
3. **Coverage**: Both happy path and error scenarios are tested
4. **Security**: Security vulnerabilities are actively tested
5. **Maintainability**: Tests are well-organized and documented

## Troubleshooting

### Common Issues

1. **Firebase Mock Issues**: Ensure all Firebase modules are properly mocked in `setupTests.js`
2. **Async Testing**: Use `waitFor` for asynchronous operations
3. **Router Issues**: Use `renderWithProviders` for components that use routing
4. **Form Testing**: Mock `react-hook-form` for form-related tests

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose
```

### Test Specific Files

Run tests for a specific file:
```bash
npm test -- --testPathPattern=AuthProvider
```

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the provided test utilities
3. Mock external dependencies appropriately
4. Include both positive and negative test cases
5. Add security tests for new authentication features
6. Update this README if adding new test categories
