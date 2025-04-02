/**
 * @feathers-cloud/task-queue
 * 
 * Main entry point for the task queue library.
 * Exports all core components and interfaces.
 */

// Core interfaces
export * from './core/interfaces/queue.interface';
export * from './core/interfaces/worker.interface';

// Core types
export * from './core/types/task.types';

// Core classes
export * from './core/queue/base-queue.class';
export * from './core/queue/queue-manager.class';
export * from './core/worker/base-worker.class';
export * from './core/worker/worker-manager.class';

// Feathers services
export * from './feathers/queue.service';
export * from './feathers/worker.service';

// Provider implementations will be exported from their respective directories
// e.g., './providers/gcp', './providers/aws', './providers/azure'
