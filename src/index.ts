/**
 * @feathers-cloud/task-queue
 * 
 * Main entry point for the task queue library.
 * Exports all core components and interfaces.
 */

// Export core interfaces and types
export * from './core/interfaces/queue.interface';
// export * from './core/interfaces/worker.interface';

// Export core types
export * from './core/types/task.types';

// Export core schemas
export * from './core/schemas/queue.schema';

// Export queue implementations
export * from './providers/gcp/gcp-queue.class';
export * from './core/queue/base-queue.class';
export * from './feathers/queue.router';

// Export Feathers service
export * from './feathers/queue.service';
// export * from './feathers/worker.service';

// Export utility functions
export * from './core/utils/debug';

// Providers
// export * from '../hold/queue-manager.class';
// export * from './core/worker/base-worker.class';
// export * from './core/worker/worker-manager.class';

// Provider implementations will be exported from their respective directories
// e.g., './providers/gcp', './providers/aws', './providers/azure'
