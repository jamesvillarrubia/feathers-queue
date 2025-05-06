// /**
//  * @feathers-cloud/task-queue
//  * 
//  * Feathers service wrapper for the worker system.
//  * This service provides a RESTful interface to interact with workers.
//  */

// import { Id, NullableId, Params, ServiceMethods } from '@feathersjs/feathers';
// import { BadRequest, MethodNotAllowed } from '@feathersjs/errors';
// import { WorkerManager } from '../core/worker/worker-manager.class';
// import { Task, TaskResult } from '../core/types/task.types';

// export interface WorkerServiceOptions {
//   workerManager: WorkerManager;
// }

// export interface WorkerParams extends Params {
//   worker?: string;
// }

// export interface WorkerStats {
//   activeTasks: number;
//   processedTasks: number;
//   failedTasks: number;
//   averageProcessingTime: number;
// }

// export class WorkerService implements Omit<ServiceMethods<Task>, 'create'> {
//   private workerManager: WorkerManager;

//   constructor(options: WorkerServiceOptions) {
//     this.workerManager = options.workerManager;
//   }

//   /**
//    * Find tasks being processed by workers
//    * Not implemented - use get() for individual tasks
//    */
//   async find(_params?: WorkerParams): Promise<Task[]> {
//     throw new MethodNotAllowed('Method not allowed');
//   }

//   /**
//    * Get a task by ID
//    * Not implemented - tasks are transient
//    */
//   async get(_id: Id, _params?: WorkerParams): Promise<Task> {
//     throw new MethodNotAllowed('Method not allowed');
//   }

//   /**
//    * Create a new task for processing
//    */
//   async create(data: Task, params?: WorkerParams): Promise<TaskResult> {
//     if (!data.type || !data.payload) {
//       throw new BadRequest('Task must have a type and payload');
//     }

//     return this.workerManager.processTask(data, params?.worker);
//   }

//   /**
//    * Update a task being processed
//    * Not implemented - tasks are immutable
//    */
//   async update(_id: Id, _data: Task, _params?: WorkerParams): Promise<Task> {
//     throw new MethodNotAllowed('Method not allowed');
//   }

//   /**
//    * Patch a task being processed
//    * Not implemented - tasks are immutable
//    */
//   async patch(_id: NullableId, _data: Partial<Task>, _params?: WorkerParams): Promise<Task> {
//     throw new MethodNotAllowed('Method not allowed');
//   }

//   /**
//    * Remove a task from processing
//    * Not implemented - use dead letter queue for failed tasks
//    */
//   async remove(_id: Id, _params?: WorkerParams): Promise<Task> {
//     throw new MethodNotAllowed('Method not allowed');
//   }

//   /**
//    * Get worker statistics
//    */
//   async getStats(workerName?: string): Promise<WorkerStats | Record<string, WorkerStats>> {
//     const stats = await this.workerManager.getStats();
//     if (workerName) {
//       const workerStats = stats[workerName];
//       if (!workerStats) {
//         throw new BadRequest(`Worker "${workerName}" not found`);
//       }
//       return workerStats;
//     }
//     return stats;
//   }

//   /**
//    * Start workers
//    */
//   async start(workerName?: string): Promise<void> {
//     if (workerName) {
//       await this.workerManager.start(workerName);
//     } else {
//       await this.workerManager.startAll();
//     }
//   }

//   /**
//    * Stop workers
//    */
//   async stop(workerName?: string): Promise<void> {
//     if (workerName) {
//       await this.workerManager.stop(workerName);
//     } else {
//       await this.workerManager.stopAll();
//     }
//   }

//   /**
//    * Setup the service
//    * This method is called by Feathers when the service is registered
//    */
//   async setup(): Promise<void> {
//     // Nothing to do here since the worker manager is already initialized
//   }
// } 