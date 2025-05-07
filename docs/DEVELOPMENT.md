# Feathers Queue Development Guide

## Overview

Feathers Queue is a cloud-agnostic task queue library for FeathersJS applications. It provides a unified interface for working with different cloud providers (GCP, AWS, Azure) while maintaining a consistent API.

## Project Structure

```
feathers-queue/
├── example/                 # Example application
├── dist/                    # Compiled output
├── src/                     # Source code
│   ├── core/               # Core interfaces and classes
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── queue/         # Base queue implementation
│   │   ├── schemas/       # TypeBox schemas
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── feathers/          # FeathersJS services
│   └── providers/         # Cloud provider implementations
│       ├── gcp/           # Google Cloud Tasks
│       ├── aws/           # AWS SQS (future)
│       └── azure/         # Azure Queue Storage (future)
└── test/                  # Test suite
    ├── config/            # Test configuration
    ├── e2e/              # End-to-end tests with emulators
    ├── helpers/          # Test helpers
    ├── integration/      # Integration tests
    ├── live-e2e/         # Live end-to-end tests with real providers
    └── unit/             # Unit tests
```

## Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Build the Library:**
   ```bash
   npm run build
   ```

3. **Run Tests:**
   ```bash
   # Run all tests
   npm test

   # Run specific test suites
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Use mock objects for external dependencies
- No cloud provider emulators required
- Run with: `npm run test:unit`

### Integration Tests
- Test interaction between Feathers services and queue implementations
- Requires GCP Cloud Tasks emulator
- Run with: `npm run test:integration`

### End-to-End Tests
- Validate complete flow using cloud provider emulators
- Requires GCP Cloud Tasks emulator
- Run with: `npm run test:e2e`

### Live Testing
- Test with real cloud providers
- Requires GCP project setup and ngrok
- Run with: `npm run test:live:with-ngrok`

## Cloud Provider Setup

### GCP Setup
1. Create a service account with Cloud Tasks Admin role
2. Set up authentication:
   ```bash
   # Using environment variables
   export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   
   # Or using gcloud CLI
   gcloud auth application-default login
   ```

### Local Development with Emulator
1. Install Google Cloud SDK
2. Install Cloud Tasks emulator:
   ```bash
   gcloud components install beta cloud-tasks-emulator
   ```
3. Start the emulator:
   ```bash
   gcloud beta emulators tasks start --host-port=localhost:8123
   ```

## Example Application

The example directory contains a complete working example:

```bash
# Run the example app
cd example
npm install
npm run dev

# Run with Docker
npm run test:example:docker:dev
```

## API Testing

The library includes OpenAPI specification and StepCI tests:

1. View API documentation:
   ```bash
   npx swagger-ui-express openapi.yaml
   ```

2. Run API tests:
   ```bash
   stepci run stepci.yaml
   ```

## Best Practices

1. **Code Style**
   - Use camelCase for variables and functions
   - Use PascalCase for classes and interfaces
   - Use kebab-case for file names
   - Use UPPER_SNAKE_CASE for constants

2. **TypeScript**
   - Use explicit types, avoid `any`
   - Leverage union types and generics
   - Use readonly modifiers where appropriate
   - Define proper return types

3. **Testing**
   - Write tests for all new features
   - Maintain test coverage
   - Use appropriate test types (unit, integration, e2e)
   - Test error cases and edge conditions

4. **Documentation**
   - Document all public APIs
   - Include examples in documentation
   - Keep README up to date
   - Document configuration options

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT 