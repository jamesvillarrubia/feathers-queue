# Feathers Queue

A FeathersJS service for managing task queues with support for multiple cloud providers and queue routing.

## Features

- Support for multiple cloud providers (GCP Cloud Tasks, AWS SQS, Azure Queue Storage)
- Queue routing with support for multiple queues
- Task scheduling and prioritization
- Dead letter queues for failed tasks
- Queue statistics and monitoring
- Emulator support for local development

## Installation

```bash
npm install feathers-queue
# or
yarn add feathers-queue
# or
pnpm add feathers-queue
```

## Architecture

Feathers Queue follows the FeathersJS service architecture pattern, providing a flexible way to manage task queues. The library supports two main approaches:

1. **Multi-Queue Routing**: Using the `QueueRouter` class to route tasks to different queues based on the `queueName` field.
2. **Single Queue Service**: Using the `QueueService` class directly for a single queue.

This architecture follows FeathersJS best practices by:
- Providing a consistent service interface
- Supporting hooks for middleware
- Following the FeathersJS service pattern
- Enabling easy integration with existing FeathersJS applications

## Configuration

Configure the queue service in your Feathers application:

```javascript
// config/default.json
{
  "feathers-queue": {
    "routing": true, // Enable routing for multi-queue support
    "defaults": {
      "provider": "gcp",
      "projectId": "your-project-id",
      "location": "us-central1",
      "defaultQueue": "default",
      "maxRetries": 3,
      "retryDelay": 1000,
      "allowedDomains": ["localhost", "example.com"]
    },
    "queues": {
      "default": {
        "provider": "gcp",
        "projectId": "your-project-id",
        "location": "us-central1",
        "maxRetries": 3,
        "retryDelay": 1000,
        "allowedDomains": ["localhost", "example.com"]
      },
      "high-priority": {
        "provider": "gcp",
        "projectId": "your-project-id",
        "location": "us-central1",
        "maxRetries": 5,
        "retryDelay": 500,
        "allowedDomains": ["localhost", "example.com"]
      }
    },
    "emulator": {
      "host": "localhost",
      "port": "8123"
    }
  }
}
```

## Usage

### Approach 1: Multi-Queue Routing

When you need to manage multiple queues through a single service endpoint, use the `QueueRouter` class:

```javascript
// services/queue.service.js
const { QueueRouter, getGCPQueueOptions } = require('feathers-queue');

module.exports = function (app) {
  // Get the entire feathers-queue config with routing enabled
  const feathersQueueConfig = getGCPQueueOptions(app);
  
  // Create a new QueueRouter with the config
  const queueRouter = new QueueRouter({
    app,
    config: feathersQueueConfig
  });
  
  // Register the router as a service
  app.use('queue', queueRouter, {
    methods: ['find', 'get', 'create', 'patch', 'remove'],
    events: []
  });
};
```

With this approach, you can route tasks to different queues by specifying the `queueName` field in the task data:

```javascript
// Enqueue a task to a specific queue
const result = await app.service('queue').create({
  type: 'urgent-task',
  data: {
    queueName: 'high-priority', // Specify the queue name
    targetUrl: 'http://localhost:3030/tasks',
    payload: { message: 'This is urgent!' }
  }
});
```

### Approach 2: Single Queue Service

When you need a dedicated service for a specific queue, use the `QueueService` class directly:

```javascript
// services/gcp-queue-1.service.js
const { QueueService, getGCPQueueOptions } = require('feathers-queue');

module.exports = function (app) {
  // Get the config for a specific queue with routing disabled
  const queueConfig = getGCPQueueOptions(app, 'queue-1');
  
  // Create a new QueueService with the config
  const queueService = new QueueService({
    app,
    config: queueConfig
  });
  
  // Register the service
  app.use('gcp-queue-1', queueService, {
    methods: ['find', 'get', 'create', 'patch', 'remove'],
    events: []
  });
};
```

With this approach, all tasks sent to this service will be processed by the specified queue:

```javascript
// Enqueue a task to the dedicated queue
const result = await app.service('gcp-queue-1').create({
  type: 'example-task',
  data: {
    targetUrl: 'http://localhost:3030/tasks',
    payload: { message: 'Hello from queue-1' }
  }
});
```

### GCP Service Example

Here's an example of how to set up a GCP service that supports both routing and non-routing approaches:

```javascript
// services/gcp.service.js
const { QueueRouter, QueueService, getGCPQueueOptions } = require('feathers-queue');

module.exports = function (app) {
  const feathersQueueConfig = app.get('feathers-queue');
  const isRouting = !!feathersQueueConfig.routing;
  
  if (isRouting) {
    // Use QueueRouter for multi-queue support
    const queueRouter = new QueueRouter({
      app,
      config: feathersQueueConfig
    });
    
    app.use('gcp', queueRouter, {
      methods: ['find', 'get', 'create', 'patch', 'remove'],
      events: []
    });
  } else {
    // Use QueueService for single queue
    const queueService = new QueueService({
      app,
      config: feathersQueueConfig
    });
    
    app.use('gcp', queueService, {
      methods: ['find', 'get', 'create', 'patch', 'remove'],
      events: []
    });
  }
};
```

## Task Handler

The task handler is responsible for processing tasks from the queue. It should be a Feathers service that can handle HTTP requests from the cloud provider.

```javascript
// services/tasks.service.js
class TasksService {
  async create(data, params) {
    // Process the task
    console.log('Processing task:', data);
    
    // Return a success response
    return { success: true };
  }
}

module.exports = function (app) {
  app.use('tasks', new TasksService());
};
```

## Queue Statistics

You can get statistics for all queues or a specific queue:

```javascript
// Get stats for all queues (with routing enabled)
const stats = await app.service('queue').getStats();
console.log('Queue stats:', stats);

// Get stats for a specific queue (with routing disabled)
const stats = await app.service('gcp-queue-1').getStats();
console.log('Queue stats:', stats);
```

## Testing

The library supports three levels of testing, each with both local CLI and Docker-based execution options:

### Test Levels

1. **Unit Tests** (`test/unit/`)
   - Tests individual components in isolation
   - No external dependencies (emulator, app) required
   - Uses mock implementations for all external services
   - Run via `npm run test:unit`

2. **Integration Tests** (`test/integration/`)
   - Tests integration with Cloud Tasks emulator
   - Two execution modes:
     - Local CLI: Uses local emulator
     - Docker: Uses containerized emulator
   - Run via:
     - `npm run test:integration` (local)
     - `npm run test:integration:docker` (Docker)

3. **E2E Tests** (`test/e2e/`)
   - Tests full integration with example app
   - Two execution modes:
     - Local: Uses example app with ngrok for public URL
     - Docker: Uses containerized example app
   - Run via:
     - `npm run test:e2e` (local)
     - `npm run test:e2e:docker` (Docker)

### Configuration Structure

```
test/
├── config/
│   ├── credentials.ts    # Mock credentials for testing
├── helpers/
│   ├── test-config.ts   # CLI-based test configuration
│   ├── test-app.ts      # Test app setup helper
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/               # E2E tests
```

### Configuration Management

1. **Unit/Integration Tests**
   - Configuration defined in test files
   - CLI overrides available via environment variables:
     ```bash
     TEST_PROJECT_ID=my-project
     TEST_LOCATION=my-location
     TEST_QUEUE_NAME=my-queue
     TEST_TASK_HANDLER_URL=http://localhost:3030/tasks
     TEST_EMULATOR_HOST=localhost
     TEST_EMULATOR_PORT=8123
     ```

2. **E2E Tests**
   - Uses example app's configuration in `/example/config/`
   - Environment-specific configs:
     - `test.json`: Test environment
     - `docker.json`: Docker environment
     - `local.json`: Local development

### Running Tests

1. **All Tests (Local)**
   ```bash
   npm run test:all
   ```

2. **All Tests (Docker)**
   ```bash
   npm run test:all:docker
   ```

3. **Individual Test Suites**
   ```bash
   # Unit tests
   npm run test:unit

   # Integration tests
   npm run test:integration        # Local
   npm run test:integration:docker # Docker

   # E2E tests
   npm run test:e2e               # Local
   npm run test:e2e:docker        # Docker
   ```

### Docker Testing

The library uses separate Docker Compose files for different testing scenarios:

1. **Integration Testing** (`docker-compose.test.yml`)
   - Runs integration tests with emulator
   - No example app required

2. **E2E Testing** (`docker-compose.e2e.yml`)
   - Runs E2E tests with example app
   - Includes both app and emulator

### Live Testing with ngrok

For testing with real Cloud Tasks:

1. Start the example app:
   ```bash
   npm run test:live:start
   ```

2. Start ngrok in a separate terminal:
   ```bash
   npm run test:live:ngrok
   ```

3. Or run both concurrently:
   ```bash
   npm run test:live:with-ngrok
   ```

### CI/CD Integration

The library includes CI-specific test commands:

```bash
# Run all tests in CI environment
npm run test:ci

# Run all tests in Docker for CI
npm run test:ci:docker
```

## FeathersJS Best Practices

Feathers Queue follows these FeathersJS best practices:

1. **Service Pattern**: Implements the FeathersJS service pattern for consistent API
2. **Hooks Support**: Supports FeathersJS hooks for middleware
3. **Configuration**: Uses FeathersJS configuration system
4. **Error Handling**: Uses FeathersJS error handling
5. **TypeScript Support**: Provides TypeScript types for better developer experience
6. **Modularity**: Follows the modular design pattern of FeathersJS

## License

MIT
