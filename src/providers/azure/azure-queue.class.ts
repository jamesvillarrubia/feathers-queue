import { BaseQueue } from '../../core/queue/base-queue.class';
import { QueueInterface, QueueOptions, SingleQueueConfig } from '../../core/interfaces/queue.interface';
import { Task, TaskResult, TaskOptions } from '../../core/types/task.types';
import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import { Application } from '@feathersjs/feathers';

export class AzureQueue extends BaseQueue implements QueueInterface {
  private client: QueueClient;
  protected options: QueueOptions;

  constructor(options: QueueOptions) {
    // Create a SingleQueueConfig from QueueOptions
    const config: SingleQueueConfig = {
      provider: options.provider,
      projectId: options.projectId || 'azure',
      location: options.location || 'azure',
      name: options.queueName || 'default',
      connectionString: options.connectionString,
      app: options.app
    };
    
    super(config);
    this.options = options;
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(
      options.connectionString || ''
    );
    this.client = queueServiceClient.getQueueClient(this.config.name || 'default');
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.name) {
      throw new Error('Queue name is required');
    }
    if (!this.options.connectionString) {
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