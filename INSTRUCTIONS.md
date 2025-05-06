# Cloud-Neutral Task Queue for Feathers.js

## System Prompt for Agentic AI

### **Objective**
Develop a **cloud-agnostic task queue** for **Feathers.js**, initially focusing on **Google Cloud Tasks** with a design that allows for future expansion to other cloud providers. The queue must support:
- **At-least-once and exactly-once processing**
- **Throttling and rate-limiting**
- **Dead-letter queues** for failed tasks
- **Cloud Tasks emulator for local testing**
- **Cloud Run compatibility for worker services**
- **Support for different execution pipelines**

---

### **Instructions for Agent**

#### **1. Define Core Library Structure**
- Build an npm module (`@feathers-queue`) with a provider-agnostic API.
- Initially implement modular support for **Google Cloud Tasks** with a design that allows for future expansion to AWS SQS and Azure Queue Storage.
- Implement **Feathers.js service wrappers** for integration.
- Ensure the library uses GCP, AWS, and Azure npm libraries wherever appropriate to prevent duplicate effort and keep the module code lightweight.

#### **2. Implement Cloud-Agnostic Queue Management**
- Abstract queue interactions behind a **common interface**.
- Enable **task dispatching to multiple cloud providers**.
- Support **FIFO and priority-based processing**.

#### **3. Develop a Retry & Dead-Letter Queue System**
- Implement a **configurable retry policy** per task.
- Support automatic failure handling and **dead-letter queueing**.
- Ensure failed tasks are **logged and retried per configurable rules**.

#### **4. Implement Cloud Tasks Emulator for Local Testing**
- Develop a **local Cloud Tasks emulator** to allow testing without cloud dependencies.
- Enable task submission and processing **entirely locally**.

#### **5. Enable Observability & Logging**
- Provide hooks for **logging task execution**.
- Optionally integrate with **Feathers.js event logging**.





---

### **Expected Deliverables**
1. **`@feathers-queue` npm module** (exporting queue interface, task dispatcher, and worker logic).
2. **Feathers.js service wrappers** for queue management.
3. **Cloud Tasks emulator** for local development.
4. **Example configurations for GCP, AWS, and Azure**.
5. **Documentation & Usage Examples** (README + API reference).

---

### **Notes for Implementation**
- Assume the **same Cloud Run container** serves as both the queue worker and API.
- Use **Docker-based horizontal scaling**.
- Provide **configurable rate-limiting and scheduling** for task execution.
- Ensure the solution can handle **large document processing workflows**.
- Design the interface to be extensible for future AWS and Azure implementations.

---


## Code Organization Conventions

### Feature-Based Organization

- Organize code by feature/domain rather than by technical concern
- Each feature should be self-contained with its own types and implementation
- Keep related code together (e.g., documentation with generators)
- Minimize cross-feature dependencies
- Use shared utilities for common functionality
- Avoid folders with only one file in them

### Type Organization

- Group related types and interfaces together
- Place types in a `/types` subdirectory within each feature
- Types should be colocated with their related functionality
- Use descriptive type names that reflect their purpose
- Document complex types with JSDoc comments

### Service Structure

- Each major feature should have a main service file
- Service files should implement core functionality
- Keep services focused and single-responsibility
- Use dependency injection for flexibility
- Document public APIs with JSDoc

### File Naming Conventions

- Use kebab-case for directory names
- Use camelCase for TypeScript files
- Use descriptive names that reflect purpose
- Group related files with consistent naming (e.g., `*.service.ts`, `*.types.ts`)
- Keep file names short but meaningful

---

🚀 **Build a robust, cross-cloud queue system that enables Feathers.js to orchestrate scalable, reliable, and fault-tolerant workflows!**


Make sure to review: 
https://developers.google.com/workspace/tasks/quickstart/nodejs and https://github.com/aertje/cloud-tasks-emulator for instructions.

# Feathers Queue Development Instructions

This document provides detailed instructions for developers working on the Feathers Queue library.

## Project Structure

```
feathers-queue/
├── example/                 # Example application
├── lib/                     # Compiled output
├── src/                     # Source code
│   ├── core/                # Core interfaces and classes
│   │   ├── interfaces/      # TypeScript interfaces
│   │   ├── queue/           # Base queue implementation
│   │   ├── schemas/         # TypeBox schemas
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── feathers/            # FeathersJS services
│   └── providers/           # Cloud provider implementations
│       ├── gcp/             # Google Cloud Tasks
│       ├── aws/             # AWS SQS (future)
│       └── azure/           # Azure Queue Storage (future)
└── test/                    # Test suite
    ├── config/              # Test configuration
    ├── e2e/                 # End-to-end tests with emulators
    ├── helpers/             # Test helpers
    ├── integration/         # Integration tests
    ├── live-e2e/            # Live end-to-end tests with real providers
    └── unit/                # Unit tests
```

## Development Environment Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/feathers-queue.git
cd feathers-queue
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the library:**

```bash
npm run build
```

4. **Run the tests:**

```bash
npm test
```

## Testing Levels

### Unit Tests

Unit tests focus on testing individual components in isolation:

```bash
npm run test:unit
```

These tests use mock objects for external dependencies and do not require any cloud provider emulators or real cloud resources.

### Integration Tests

Integration tests focus on the interaction between Feathers services and queue implementations:

```bash
npm run test:integration
```

These tests require the GCP Cloud Tasks emulator:

```bash
# Install the Google Cloud SDK
curl https://sdk.cloud.google.com | bash
gcloud components install beta cloud-tasks-emulator

# Start the emulator
gcloud beta emulators tasks start --host-port=localhost:8123
```

### End-to-End (E2E) Tests

E2E tests validate the complete flow using cloud provider emulators:

```bash
npm run test:e2e
```

These tests also require the GCP Cloud Tasks emulator as mentioned above.

### Live End-to-End Tests

Live E2E tests integrate with real cloud providers:

```bash
npm run test:live-e2e
```

**Requirements:**

1. **GCP Service Account:** Create a service account with the Cloud Tasks Admin role
2. **GCP Credentials:** Set up authentication either via:
   - Environment variables: `GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json`
   - Gcloud CLI: `gcloud auth application-default login`
3. **Ngrok:** Install and configure ngrok for public URL:
   ```bash
   npm install -g ngrok
   # In a separate terminal:
   ngrok http 3030
   ```

### Running the Example App

The example directory contains a complete working example:

```bash
cd example
npm install
npm run dev
```

For testing with real cloud providers:

```bash
# Using environment variables
GCP_PROJECT_ID=your-project-id \
GCP_LOCATION=us-central1 \
GCP_SERVICE_ACCOUNT_EMAIL=your-service-account@example.com \
npm run dev

# Using Docker
docker-compose up
```

## Working with Cloud Provider Emulators

### Google Cloud Tasks Emulator

1. **Installation:**

```bash
gcloud components install beta cloud-tasks-emulator
```

2. **Starting the emulator:**

```bash
gcloud beta emulators tasks start --host-port=localhost:8123
```

3. **Configuration in tests:**

```javascript
// In your test setup
process.env.CLOUD_TASKS_EMULATOR = 'true';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.GOOGLE_CLOUD_TASKS_EMULATOR_HOST = 'localhost:8123';
```

## Debugging

For detailed logging:

```bash
# Enable all debug logs
DEBUG=feathers:queue:* npm test

# Enable specific debug logs
DEBUG=feathers:queue:gcp npm test
```

## Continuous Integration

The CI pipeline runs different test levels depending on the context:

1. **Pull Requests:** Unit tests and integration tests with emulators
2. **Main Branch:** All tests including E2E tests with emulators
3. **Release Branch:** All tests including live E2E tests with real providers (requires credentials)

## Project Standards

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the functional programming approach
- Write comprehensive JSDoc comments
- Use TypeScript for type safety

### Git Workflow

- Use feature branches for development
- Submit pull requests with proper descriptions
- Include tests for all changes
- Keep commits focused and atomic

### Documentation

- Update README.md with new features
- Update CHANGELOG.md for new releases
- Keep INSTRUCTIONS.md up-to-date with development practices
- Document any breaking changes prominently

