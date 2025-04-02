# @feathers-cloud/task-queue

A cloud-agnostic task queue for Feathers.js with support for Google Cloud Tasks, AWS SQS, and Azure Queue Storage.

## Features

- Cloud-agnostic task queue with support for multiple cloud providers
- At-least-once and exactly-once processing
- Throttling and rate-limiting
- Dead-letter queues for failed tasks
- Cloud Tasks emulator for local testing
- Cloud Run compatibility for worker services
- Support for different execution pipelines
- Feathers.js service wrappers for easy integration

## Installation

```bash
npm install @feathers-cloud/task-queue
```

## Usage

### Basic Setup

```typescript
import { QueueManager, WorkerManager } from '@feathers-cloud/task-queue';
import { GCPQueue } from '@feathers-cloud/task-queue/providers/gcp';

// Create queue manager
const queueManager = new QueueManager(app);

// Create and register a GCP queue
const gcpQueue = new GCPQueue({
  app,
  configPath: 'taskQueue.gcp',
});

queueManager.registerQueue('default', gcpQueue);

// Create worker manager
const workerManager = new WorkerManager(app);

// Register task handlers
workerManager.registerHandler('processImage', async task => {
  // Process the task
  const result = await processImage(task.payload);
  return { success: true, result };
});

// Start workers
await workerManager.startAll();
```

### Enqueueing Tasks

```typescript
// Using the queue manager directly
const taskId = await queueManager.enqueue({
  type: 'processImage',
  payload: {
    url: 'https://example.com/image.jpg',
    filters: ['resize', 'blur'],
  },
  metadata: {
    priority: 1,
    scheduledFor: Date.now() + 60000, // Schedule for 1 minute from now
  },
});

// Using the Feathers service
const task = await app.service('tasks').create({
  type: 'processImage',
  payload: {
    url: 'https://example.com/image.jpg',
    filters: ['resize', 'blur'],
  },
  metadata: {
    priority: 1,
    scheduledFor: Date.now() + 60000,
  },
});
```

### Configuration

Configure the task queue in your Feathers.js application:

```typescript
// config/default.json
{
  "taskQueue": {
    "gcp": {
      "projectId": "your-project-id",
      "location": "us-central1",
      "queues": {
        "default": {
          "name": "default-queue",
          "maxRetries": 3,
          "retryDelay": 60000,
          "rateLimit": {
            "maxTasksPerSecond": 10,
            "maxConcurrentTasks": 5
          }
        }
      }
    },
    "aws": {
      "region": "us-east-1",
      "queues": {
        "default": {
          "name": "default-queue.fifo",
          "maxRetries": 3,
          "retryDelay": 60000
        }
      }
    },
    "azure": {
      "connectionString": "your-connection-string",
      "queues": {
        "default": {
          "name": "default-queue",
          "maxRetries": 3,
          "retryDelay": 60000
        }
      }
    }
  }
}
```

### Cloud Provider Support

#### Google Cloud Tasks

```typescript
import { GCPQueue } from '@feathers-cloud/task-queue/providers/gcp';

const gcpQueue = new GCPQueue({
  app,
  configPath: 'taskQueue.gcp',
});

queueManager.registerQueue('gcp', gcpQueue);
```

#### AWS SQS

```typescript
import { AWSQueue } from '@feathers-cloud/task-queue/providers/aws';

const awsQueue = new AWSQueue({
  app,
  configPath: 'taskQueue.aws',
});

queueManager.registerQueue('aws', awsQueue);
```

#### Azure Queue Storage

```typescript
import { AzureQueue } from '@feathers-cloud/task-queue/providers/azure';

const azureQueue = new AzureQueue({
  app,
  configPath: 'taskQueue.azure',
});

queueManager.registerQueue('azure', azureQueue);
```

### Local Development

For local development, you can use the built-in Cloud Tasks emulator:

```typescript
import { LocalQueue } from '@feathers-cloud/task-queue/emulator';

const localQueue = new LocalQueue({
  app,
  configPath: 'taskQueue.local',
});

queueManager.registerQueue('local', localQueue);
```

## API Reference

### QueueManager

The `QueueManager` class provides a unified interface for managing multiple queues:

- `registerQueue(name: string, queue: QueueInterface): void`
- `getQueue(name?: string): QueueInterface`
- `enqueue(task: Task, options?: TaskOptions): Promise<string>`
- `dequeue(queueName?: string): Promise<Task | null>`
- `acknowledge(taskId: string, queueName?: string): Promise<void>`
- `deadLetter(taskId: string, error: Error, queueName?: string): Promise<void>`
- `getStats(): Promise<Record<string, QueueStats>>`

### WorkerManager

The `WorkerManager` class manages task processing across multiple workers:

- `registerWorker(name: string, worker: WorkerInterface): void`
- `registerHandler(type: string, handler: TaskHandler): void`
- `startAll(): Promise<void>`
- `stopAll(): Promise<void>`
- `processTask(task: Task): Promise<TaskResult>`
- `getStats(): Promise<Record<string, WorkerStats>>`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
