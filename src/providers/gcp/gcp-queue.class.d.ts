import { BaseQueue } from '../../core/base-queue.class';
import { QueueInterface, QueueStats } from '../../core/queue.types';
import { LibraryConfig, QueueConfig } from '../../core/queue.types';
import { Task, TaskOptions } from '../../core/task.types';
import { Application } from '@feathersjs/feathers';
export interface QueueStatsResult {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}
export interface GCPQueueOptions extends QueueConfig {
    projectId: string;
    location: string;
    serviceAccountEmail?: string;
    emulator?: {
        host: string;
        port: string;
    };
    queueName: string;
    taskHandlerUrl?: string;
    handlerRootPath?: string;
    maxRetries?: number;
    priority?: number;
    scheduledFor?: number;
    exactlyOnce?: boolean;
    allowedDomains?: string[];
    enhancedStats?: boolean;
}
/**
 * Creates a map of queue instances from a FeathersQueueConfig
 * @param config The FeathersQueueConfig containing queue configurations
 * @returns A map of queue instances keyed by queue name
 */
export declare function queueFactory(config: LibraryConfig): Record<string, GCPQueue>;
export declare class GCPQueue extends BaseQueue implements QueueInterface {
    private client;
    private projectId;
    private location;
    private serviceAccountEmail?;
    private taskHandlerUrl?;
    private handlerRootPath?;
    private allowedDomains;
    private queues;
    private defaultQueueName;
    private queueName;
    private enhancedStats;
    constructor(options: GCPQueueOptions);
    /**
     * Initialize multiple queues from a FeathersQueueConfig
     * @param config The FeathersQueueConfig containing queue configurations
     */
    initializeQueues(config: LibraryConfig): void;
    protected validateConfig(): Promise<void>;
    setupQueue(): Promise<void>;
    protected validateTask(task: Task): void;
    /**
     * Validate that the domain is in the allowed list
     */
    private validateDomain;
    /**
     * Get the appropriate queue for a task based on the queueName in the task options
     * @param task The task to enqueue
     * @param options Optional task options
     * @returns The queue to use for this task
     */
    private getQueueForTask;
    enqueue(task: Task, options?: TaskOptions): Promise<string>;
    dequeue(): Promise<Task | null>;
    acknowledge(_taskId: string): Promise<void>;
    deadLetter(_taskId: string, _error: Error): Promise<void>;
    getStats(): Promise<QueueStats>;
    cleanup(): Promise<void>;
}
export declare const getGCPQueueOptions: (app: Application, queueName?: string) => LibraryConfig;
//# sourceMappingURL=gcp-queue.class.d.ts.map