/**
 * @feathers-cloud/task-queue
 * 
 * Debug utility for the queue library.
 * This follows Feathers debug standards for consistent logging.
 */

import debug from 'debug';

// Create debug namespaces for different parts of the queue library
export const debugQueue = debug('feathers:queue');
export const debugGCP = debug('feathers:queue:gcp');
export const debugTask = debug('feathers:queue:task');
export const debugService = debug('feathers:queue:service');

// Helper function to format objects for debug output
export const formatDebug = (obj: any): string => {
  return JSON.stringify(obj, null, 2);
};

// Helper function to log task creation
export const logTaskCreation = (task: any, options?: any): void => {
  debugTask('Creating task: %s', formatDebug({
    type: task.type,
    id: task.id,
    data: task.data,
    options
  }));
};

// Helper function to log task processing
export const logTaskProcessing = (task: any): void => {
  debugTask('Processing task: %s', formatDebug({
    type: task.type,
    id: task.id,
    data: task.data
  }));
};

// Helper function to log task completion
export const logTaskCompletion = (task: any, result: any): void => {
  debugTask('Task completed: %s with result: %s', 
    formatDebug({
      type: task.type,
      id: task.id
    }),
    formatDebug(result)
  );
};

// Helper function to log task failure
export const logTaskFailure = (task: any, error: any): void => {
  debugTask('Task failed: %s with error: %s', 
    formatDebug({
      type: task.type,
      id: task.id
    }),
    formatDebug({
      message: error.message,
      stack: error.stack
    })
  );
}; 