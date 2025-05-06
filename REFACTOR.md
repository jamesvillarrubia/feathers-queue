I'll help you create a system prompt and instructions for cleaning up, reformatting, and testing your library. Let me first explore the codebase to understand what we're working with.

Ran tool
Let me check the package.json to understand the type of library and its dependencies.

Read file: package.json
Now let me look at the source code structure:

Ran tool
Let's check the README for more context:

Read file: README.md
Let me check the source code index file:

Read file: src/index.ts
Let me look at one of the core classes:

Read file: src/feathers/queue.service.ts
Let me look at the test files to understand the testing setup:

Ran tool
Based on my exploration, I understand that this is a FeathersJS service for managing task queues across different cloud providers (GCP, AWS, Azure). Now I'll create a comprehensive system prompt and instructions for cleaning up, reformatting, testing, and refining this library.

VERY IMPORTANT: Ask questions about format and standards if it is unclear.  

# Feathers Queue Library Cleanup and Refactoring Guide

## Introduction
Feathers Queue is a cloud-agnostic task queue library for FeathersJS applications. This guide provides a structured approach to clean up, refactor, and enhance the library, ensuring it follows modern JavaScript/TypeScript best practices.

## System Prompt for Library Cleanup

When approaching the cleanup and refactoring of the Feathers Queue library, follow this structured plan:

1. **Code Assessment**
   - Analyze existing code structure and organization
   - Identify inconsistencies in patterns, naming, and documentation
   - Review type definitions and interface completeness
   - Identify deprecated or unused code

2. **Documentation Audit**
   - Ensure each file has a proper JSDoc header explaining its purpose
   - Verify function and method documentation is complete
   - Check that examples are up-to-date and accurate
   - Validate that API documentation matches implementation

3. **Testing Review**
   - Assess test coverage across unit, integration, and e2e tests
   - Identify missing test cases and coverage gaps
   - Ensure tests follow consistent patterns
   - Verify that test fixtures are well organized

4. **Dependency Analysis**
   - Review all dependencies for necessity and updates
   - Check for security vulnerabilities
   - Consider alternatives for deprecated packages
   - Ensure appropriate peer dependencies

5. **Type System Enhancement**
   - Strengthen TypeScript types and interfaces
   - Remove any `any` types where possible
   - Add generics where they improve type safety
   - Ensure exported types are comprehensive and well-documented

6. **Modular Architecture Refinement**
   - Ensure clear separation of concerns between modules
   - Validate that the provider abstraction is consistent
   - Review service interfaces for completeness
   - Check that the router implementation follows best practices

7. **Performance Review**
   - Identify potential bottlenecks
   - Review error handling and retry mechanisms
   - Ensure proper resource cleanup
   - Optimize critical paths

8. **Code Style Harmonization**
   - Apply consistent naming conventions
   - Standardize code formatting
   - Ensure consistent import/export patterns
   - Verify adherence to functional programming principles

## Step-by-Step Cleanup Instructions

### 1. Project Setup and Environment Preparation

```bash
# Install dependencies and dev tools
npm install

# Install latest linting and formatting tools
npm add -D typescript@latest eslint@latest prettier@latest vitest@latest

# Update TypeScript configuration
npx tsc --init --target es2020 --module esnext --outDir lib --declaration --strict

# Set up Git hooks for pre-commit linting and formatting
npm add -D husky lint-staged
npx husky install
npm pkg set scripts.prepare="husky install"
```

### 2. Code Structure and Organization

```bash
# Create consistent directory structure
mkdir -p src/{core,providers/{gcp,aws,azure},feathers,utils}

# Move files to appropriate directories
# Follow the pattern:
# - Core interfaces and types in core/
# - Provider-specific code in providers/{provider-name}/
# - Feathers services in feathers/
# - Utility functions in utils/
```

### 3. Documentation Enhancement

```bash
# Install documentation tools
npm add -D typedoc

# Set up documentation generation
npm pkg set scripts.docs="typedoc --out docs src/index.ts"

# Update README with clear examples and API documentation
```

### 4. Testing Improvement

```bash
# Set up comprehensive test suite
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:coverage="vitest run --coverage"
npm pkg set scripts.test:watch="vitest"

# Create test helpers for each provider
touch test/helpers/{gcp,aws,azure}-helpers.ts

# Implement missing tests for core functionality
```

### 5. Code Quality Enhancement

```bash
# Run linting across the codebase
npm run lint -- --fix

# Apply formatting rules
npm run format

# Run type checking
npx tsc --noEmit
```

### 6. Build and Package Configuration

```bash
# Set up clean build process
npm pkg set scripts.clean="rm -rf lib"
npm pkg set scripts.build="npm run clean && tsc"
npm pkg set scripts.prepublishOnly="npm run lint && npm run test && npm run build"

# Update package.json metadata
# - Ensure dependencies are correctly categorized
# - Set appropriate keywords
# - Verify license information
```

### 7. API Consistency Review

```bash
# Create API documentation using TypeDoc
npm run docs

# Review and update exported interfaces and types
# Ensure consistent naming patterns across the API
```

### 8. Examples and Integration Tests

```bash
# Create comprehensive examples for each provider
mkdir -p example/{gcp,aws,azure}

# Set up integration tests with cloud emulators
npm pkg set scripts.test:integration="vitest run test/integration"
```

## Implementation Checklist

### Core Architecture
- [ ] Review and refine core interfaces
- [ ] Strengthen type definitions
- [ ] Ensure consistent error handling across providers
- [ ] Implement missing provider features
- [ ] Add comprehensive logging and debugging

### Provider Implementation
- [ ] Complete GCP Cloud Tasks implementation
- [ ] Finalize AWS SQS implementation
- [ ] Complete Azure Queue Storage implementation
- [ ] Add emulator support for local development
- [ ] Ensure consistent behavior across providers

### Feathers Integration
- [ ] Refine service methods for consistency
- [ ] Enhance router functionality
- [ ] Implement missing service features
- [ ] Add support for hooks and events
- [ ] Update configuration schema

### Testing
- [ ] Expand unit test coverage
- [ ] Implement comprehensive integration tests for the Feathers service layer
- [ ] Add end-to-end tests with cloud provider emulators
- [ ] Create live end-to-end tests with real cloud providers
- [ ] Implement CI pipeline that safely runs all test levels
- [ ] Update test documentation

### Documentation
- [ ] Update README with comprehensive examples
- [ ] Create API documentation
- [ ] Add migration guide for upgrades
- [ ] Document configuration options
- [ ] Add troubleshooting guide

## Best Practices to Follow

1. **Consistent naming conventions**
   - Use camelCase for variables and functions
   - Use PascalCase for classes and interfaces
   - Use kebab-case for file names
   - Use UPPER_SNAKE_CASE for constants

2. **Functional programming patterns**
   - Prefer pure functions where possible
   - Use immutable data structures
   - Minimize side effects
   - Leverage higher-order functions

3. **TypeScript best practices**
   - Use explicit types, avoiding `any`
   - Leverage union types and generics
   - Use readonly modifiers where appropriate
   - Define proper return types for functions

4. **Code organization**
   - One class/purpose per file
   - Clear separation of concerns
   - Consistent import/export patterns
   - Logical directory structure

5. **Error handling**
   - Use typed errors
   - Provide meaningful error messages
   - Handle edge cases explicitly
   - Add proper logging

This comprehensive guide provides a structured approach to cleaning up, reformatting, testing, and enhancing the Feathers Queue library, ensuring it follows modern JavaScript/TypeScript best practices and maintains a consistent, high-quality codebase.

### Testing Strategy

Feathers Queue follows a comprehensive testing strategy with multiple layers:

1. **Unit Tests (`test/unit/`)** 
   - Test individual components in isolation
   - Mock all external dependencies
   - Focus on core logic and validation
   - Run fast and don't require any external services

2. **Integration Tests (`test/integration/`)**
   - Test the interaction between Feathers services and queue implementations
   - Verify the service layer properly wraps the queue implementation
   - Use mocks for cloud provider APIs
   - Ensure proper error handling across integration points

3. **End-to-End Tests (`test/e2e/`)**
   - Test the complete flow using cloud provider emulators
   - Verify task creation, processing, and acknowledgment
   - Use GCP Cloud Tasks emulator for testing
   - Run in CI environment without real cloud resources

4. **Live End-to-End Tests (`test/live-e2e/`)**
   - Test integration with real cloud providers
   - Verify task delivery to external callback URLs
   - Use ngrok to expose local service endpoints
   - Require actual cloud credentials and resources
   - Typically run manually or in secure CI environments with proper credentials

5. **Example App (`/example`)**
   - Provide a complete working example
   - Demonstrate real-world usage patterns
   - Support running with either emulators or real cloud providers
   - Include Docker setup for easy deployment and testing
