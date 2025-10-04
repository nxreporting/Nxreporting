# Comprehensive Test Suite for Vercel + Supabase Migration

This directory contains a comprehensive test suite designed to validate the migration from Railway + PlanetScale to Vercel + Supabase architecture.

## Test Structure

```
__tests__/
├── unit/                          # Unit tests for individual components
│   ├── api/                       # API route unit tests
│   │   ├── auth.test.ts          # Authentication endpoints
│   │   ├── extract.test.ts       # PDF extraction endpoint
│   │   ├── files.test.ts         # File management endpoints
│   │   ├── brands.test.ts        # Brand management endpoints
│   │   └── health.test.ts        # Health check endpoint
│   └── lib/                       # Library/utility unit tests
│       ├── auth.test.ts          # Authentication utilities
│       └── storage.test.ts       # Storage utilities
├── integration/                   # Integration tests for full workflows
│   ├── auth-flow.test.ts         # Complete authentication flow
│   ├── pdf-processing-flow.test.ts # End-to-end PDF processing
│   └── deployment-validation.test.ts # Deployment readiness checks
├── test-runner.ts                 # Comprehensive test runner script
├── production-validation.ts       # Production deployment validator
└── README.md                      # This file
```

## Test Categories

### 1. Unit Tests
Test individual API routes and utility functions in isolation.

**Coverage:**
- ✅ Authentication endpoints (`/api/auth/*`)
- ✅ PDF extraction endpoint (`/api/extract`)
- ✅ File management endpoints (`/api/files/*`)
- ✅ Brand management endpoints (`/api/brands/*`)
- ✅ Health check endpoint (`/api/health`)
- ✅ Authentication utilities
- ✅ Storage utilities
- ✅ Error handling and validation

### 2. Integration Tests
Test complete workflows and interactions between components.

**Coverage:**
- ✅ Complete user registration → login → protected route access flow
- ✅ End-to-end PDF upload → extraction → data processing flow
- ✅ File validation and cloud storage integration
- ✅ Error handling across multiple components
- ✅ Timeout and memory management

### 3. Deployment Validation Tests
Validate that the application is properly configured for production deployment.

**Coverage:**
- ✅ Environment variable validation
- ✅ Database connectivity
- ✅ API route availability
- ✅ Memory and performance checks
- ✅ Security configuration
- ✅ External service configuration
- ✅ Monitoring and logging setup

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up test environment variables:
```bash
cp .env.example .env.test
```

3. Generate Prisma client:
```bash
npx prisma generate
```

### Individual Test Suites

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run API tests only
npm run test:api

# Run deployment validation tests only
npm run test:deployment

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Comprehensive Test Runner

Run the complete test suite with detailed reporting:

```bash
npm run test:all
```

This will:
- Execute all test categories
- Generate coverage reports
- Create detailed test reports
- Provide comprehensive validation summary

### Production Validation

Validate a deployed application:

```bash
# Test local deployment
npm run test:production http://localhost:3000

# Test production deployment
npm run test:production https://your-app.vercel.app
```

## Continuous Integration

The test suite is integrated with GitHub Actions for automated testing:

- **On Push/PR**: Runs complete test suite
- **Multiple Node Versions**: Tests against Node.js 18.x and 20.x
- **Database Testing**: Uses PostgreSQL service for realistic testing
- **Security Scanning**: Runs npm audit for vulnerability detection
- **Coverage Reporting**: Uploads coverage to Codecov

## Test Configuration

### Jest Configuration
- **Environment**: Node.js (for API testing)
- **Test Timeout**: 30 seconds (for integration tests)
- **Coverage**: Tracks API routes and lib functions
- **Mocking**: Comprehensive mocks for external services

### Mock Services
- **Prisma Database**: Mocked for unit tests
- **External APIs**: Nanonets, OpenAI mocked
- **File System**: Mocked for serverless compatibility
- **Authentication**: JWT mocking for protected routes

## Test Data and Fixtures

### Mock Data
- User accounts with various roles
- Sample PDF files and extraction results
- Brand database entries
- File upload scenarios

### Environment Variables
All tests use safe test values:
- `JWT_SECRET`: Test-only secret
- `DATABASE_URL`: Test database connection
- `NANONETS_API_KEY`: Mock API key
- `BLOB_READ_WRITE_TOKEN`: Mock storage token

## Validation Criteria

### Unit Tests
- ✅ All API routes respond correctly
- ✅ Input validation works properly
- ✅ Error handling is comprehensive
- ✅ Authentication/authorization functions correctly
- ✅ File processing utilities work as expected

### Integration Tests
- ✅ Complete user workflows function end-to-end
- ✅ PDF processing pipeline works correctly
- ✅ Database operations are properly integrated
- ✅ Error scenarios are handled gracefully
- ✅ Performance requirements are met

### Deployment Validation
- ✅ All required environment variables are present
- ✅ Database connectivity is established
- ✅ External services are properly configured
- ✅ Security settings are appropriate
- ✅ Memory and performance are within limits

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running (for integration tests)
   - Check DATABASE_URL format
   - Run `npx prisma migrate deploy`

2. **Mock Service Failures**
   - Clear Jest cache: `npx jest --clearCache`
   - Restart test runner
   - Check mock configurations in `jest.setup.js`

3. **Timeout Errors**
   - Increase test timeout in Jest config
   - Check for infinite loops in async operations
   - Verify mock implementations

4. **Coverage Issues**
   - Ensure all files are properly imported
   - Check coverage thresholds in Jest config
   - Review excluded files/patterns

### Debug Mode

Run tests with debug output:

```bash
# Enable debug logging
DEBUG=* npm test

# Run specific test file
npm test -- auth.test.ts

# Run tests with verbose output
npm test -- --verbose
```

## Contributing

When adding new features or API routes:

1. **Add Unit Tests**: Test the new functionality in isolation
2. **Add Integration Tests**: Test how it integrates with existing features
3. **Update Validation**: Add checks to deployment validation if needed
4. **Update Documentation**: Update this README with new test coverage

### Test Naming Convention

- Unit tests: `[component].test.ts`
- Integration tests: `[workflow]-flow.test.ts`
- Validation tests: `[category]-validation.test.ts`

### Test Structure

```typescript
describe('Component/Feature Name', () => {
  beforeEach(() => {
    // Setup for each test
  })

  describe('specific functionality', () => {
    it('should handle normal case', async () => {
      // Test implementation
    })

    it('should handle error case', async () => {
      // Error test implementation
    })
  })
})
```

## Reports and Artifacts

### Test Reports
- JSON reports saved to `__tests__/test-reports/`
- Coverage reports in `coverage/`
- Production validation reports in `__tests__/production-reports/`

### CI Artifacts
- Test results uploaded to GitHub Actions
- Coverage reports sent to Codecov
- Build artifacts for deployment testing

## Migration Validation Checklist

Use this checklist to ensure complete migration validation:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Deployment validation passes
- [ ] Production validation passes (on deployed app)
- [ ] Coverage meets minimum thresholds (80%+)
- [ ] No security vulnerabilities detected
- [ ] Performance benchmarks met
- [ ] All environment variables configured
- [ ] Database migrations successful
- [ ] External services properly integrated

## Support

For issues with the test suite:

1. Check this README for troubleshooting steps
2. Review test logs and error messages
3. Verify environment configuration
4. Check GitHub Actions logs for CI issues
5. Review Jest and testing framework documentation