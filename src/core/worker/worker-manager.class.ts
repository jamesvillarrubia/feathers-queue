/**
 * @feathers-cloud/task-queue
 * 
 * Worker manager class that handles multiple workers and provides a unified interface.
 */

import { Application } from '@feathersjs/feathers';
import { WorkerInterface, WorkerOptions } from '../interfaces/worker.interface';
import { Task, TaskHandler, TaskResult } from '../types/task.types';

export class WorkerManager {
  private app: Application;
  private workers: Map<string, WorkerInterface> = new Map();
  private defaultWorker: string = 'default';

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Register a new worker
   */
  registerWorker(name: string, worker: WorkerInterface): void {
    if (this.workers.has(name)) {
      throw new Error(`Worker with name "${name}" already exists`);
    }
    this.workers.set(name, worker);
  }

  /**
   * Get a worker by name
   */
  getWorker(name?: string): WorkerInterface {
    const workerName = name || this.defaultWorker;
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker with name "${workerName}" not found`);
    }
    return worker;
  }

  /**
   * Set the default worker
   */
  setDefaultWorker(name: string): void {
    if (!this.workers.has(name)) {
      throw new Error(`Worker with name "${name}" not found`);
    }
    this.defaultWorker = name;
  }

  /**
   * Register a task handler with a specific worker
   */
  registerHandler(type: string, handler: TaskHandler, workerName?: string): void {
    const worker = this.getWorker(workerName);
    worker.registerHandler(type, handler);
  }

  /**
   * Start all workers
   */
  async startAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.start();
    }
  }

  /**
   * Stop all workers
   */
  async stopAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.stop();
    }
  }

  /**
   * Start a specific worker
   */
  async start(workerName?: string): Promise<void> {
    const worker = this.getWorker(workerName);
    await worker.start();
  }

  /**
   * Stop a specific worker
   */
  async stop(workerName?: string): Promise<void> {
    const worker = this.getWorker(workerName);
    await worker.stop();
  }

  /**
   * Process a task with a specific worker
   */
  async processTask(task: Task, workerName?: string): Promise<TaskResult> {
    const worker = this.getWorker(workerName);
    return worker.processTask(task);
  }

  /**
   * Get statistics for all workers
   */
  async getStats(): Promise<Record<string, {
    activeTasks: number;
    processedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
  }>> {
    const stats: Record<string, any> = {};
    for (const [name, worker] of this.workers.entries()) {
      stats[name] = await worker.getStats();
    }
    return stats;
  }
} 