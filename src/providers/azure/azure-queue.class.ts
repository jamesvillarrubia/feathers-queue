/**
 * @feathers-cloud/task-queue
 * 
 * Azure Storage Queue implementation of the QueueInterface.
 */

import { BaseQueue } from '../../core/base-queue.class';
import { QueueInterface, QueueConfig } from '../../core/queue.types';
import { Task, TaskOptions } from '../../core/task.types';
import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import { Application } from '@feathersjs/feathers';

export interface AzureQueueConfig extends QueueConfig {
  connectionString: string;
  queueUrl?: string;
}

export class AzureQueue extends BaseQueue implements QueueInterface {
  private client: QueueClient;

  constructor(options: AzureQueueConfig) {
    super(options);
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(
      options.connectionString
    );
    this.client = queueServiceClient.getQueueClient(options.name);
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.name) {
      throw new Error('Queue name is required');
    }
    const azureConfig = this.config as AzureQueueConfig;
    if (!azureConfig.connectionString) {
      throw new Error('Azure connection string is required');
    }
  }

  protected async setupQueue(): Promise<void> {
    await this.client.create();
  }

  async enqueue(task: Task, options?: TaskOptions): Promise<string> {
    const message = {
      type: task.type,
      payload: task.payload,
      options: options,
    };

    const response = await this.client.sendMessage(
      JSON.stringify(message),
      {
        visibilityTimeout: options?.scheduledFor
          ? Math.floor((options.scheduledFor - Date.now()) / 1000)
          : 0,
      }
    );

    return response.messageId;
  }

  async dequeue(): Promise<Task | null> {
    const response = await this.client.receiveMessages({
      numberOfMessages: 1,
      visibilityTimeout: 300, // 5 minutes
    });

    if (!response.receivedMessageItems.length) return null;

    const message = response.receivedMessageItems[0];
    const task = JSON.parse(message.messageText) as Task;
    task.id = message.messageId;
    task.popReceipt = message.popReceipt;

    return task;
  }

  async acknowledge(taskId: string): Promise<void> {
    // Azure Queue Storage handles acknowledgments via message deletion
    // This method is not needed for Azure implementation
  }

  async deadLetter(taskId: string, error: Error): Promise<void> {
    // Azure Queue Storage handles dead lettering via separate queues
    // This method is not needed for Azure implementation
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const properties = await this.client.getProperties();
    return {
      pending: properties.approximateMessagesCount || 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
  }

  async cleanup(): Promise<void> {
    await this.client.delete();
  }
} 