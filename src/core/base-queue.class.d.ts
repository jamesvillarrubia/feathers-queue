/**
 * @feathers-cloud/task-queue
 *
 * Base queue class that implements the QueueInterface and provides common functionality
 * for all queue implementations.
 */
import { Application } from '@feathersjs/feathers';
import { QueueInterface, QueueConfig } from './queue.types';
import { Task, TaskOptions } from './task.types';
export declare abstract class BaseQueue implements QueueInterface {
    protected app: Application;
    protected configPath: string;
    protected config: QueueConfig;
    protected isInitialized: boolean;
    constructor(options: QueueConfig);
    /**
     * Initialize the queue with configuration
     */
    initialize(config: QueueConfig): Promise<void>;
    /**
     * Validate the queue configuration
     */
    protected abstract validateConfig(): Promise<void>;
    /**
     * Set up the queue infrastructure
     */
    protected abstract setupQueue(): Promise<void>;
    /**
     * Add a task to the queue
     */
    abstract enqueue(task: Task, options?: TaskOptions): Promise<string>;
    /**
     * Process a task from the queue
     */
    abstract dequeue(): Promise<Task | null>;
    /**
     * Acknowledge successful task processing
     */
    abstract acknowledge(taskId: string): Promise<void>;
    /**
     * Move a failed task to the dead letter queue
     */
    abstract deadLetter(taskId: string, error: Error): Promise<void>;
    /**
     * Get queue statistics
     */
    abstract getStats(): Promise<{
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    }>;
    /**
     * Clean up resources
     */
    abstract cleanup(): Promise<void>;
    /**
     * Validate a task before enqueueing
     */
    protected validateTask(task: Task): void;
    /**
     * Merge task options with default configuration
     */
    protected mergeTaskOptions(options?: TaskOptions): TaskOptions;
}
//# sourceMappingURL=base-queue.class.d.ts.map