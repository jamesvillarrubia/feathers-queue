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

## Testing Framework

Feathers Queue includes a comprehensive testing framework with multiple layers:

### Unit Tests

Unit tests verify the functionality of individual components in isolation, using mocks for external dependencies:

```bash
npm run test:unit
```

These tests ensure that core classes like `BaseQueue`, `GCPQueue`, and validation functions work correctly in isolation.

### Integration Tests

Integration tests verify that the components work together with the Feathers service layer:

```bash
npm run test:integration
```

These tests wrap around the Feathers Service level and test the interaction between the queue service and queue implementations.

### End-to-End (E2E) Tests

E2E tests verify the complete flow using cloud provider emulators:

```bash
npm run test:e2e
```

These tests use the GCP Cloud Tasks emulator to test the complete flow from task creation to processing, without requiring actual cloud resources.

### Live End-to-End Tests

Live E2E tests verify the integration with real cloud resources:

```bash
npm run test:live-e2e
```

**Note:** These tests require actual GCP credentials and resources. They use ngrok to expose your local service to the internet for callback handling.

### Running the Example App

The `/example` directory contains a complete example application that demonstrates real-world usage:

```bash
cd example
npm install
npm run dev
```

For testing with real cloud providers, you can use environment variables or Docker:

```bash
# Using environment variables
GCP_PROJECT_ID=your-project-id \
GCP_LOCATION=us-central1 \
GCP_SERVICE_ACCOUNT_EMAIL=your-service-account@example.com \
npm run dev

# Using Docker
docker-compose up
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
