/**
 * @feathers-cloud/task-queue
 * 
 * AWS SQS implementation of the QueueInterface.
 */

import { BaseQueue } from '../../core/base-queue.class';
import { QueueInterface, QueueConfig, LibraryConfig } from '../../core/queue.types';
import { Task, TaskResult, TaskOptions } from '../../core/task.types';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { Application } from '@feathersjs/feathers';
import { GCPQueueOptions } from '../gcp/gcp-queue.class';

export interface AWSQueueConfig extends QueueConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  queueUrl?: string;
}

export class AWSQueue extends BaseQueue implements QueueInterface {
  private client: SQSClient;
  private queueUrl: string;

  constructor(options: AWSQueueConfig) {
    super(options);
    
    // Create AWS SQS client
    this.client = new SQSClient({
      region: options.region,
      credentials: options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
          }
        : undefined,
    });

    // Set queue URL
    this.queueUrl = options.queueUrl || `https://sqs.${options.region}.amazonaws.com/queue/${options.name}`;
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.name) {
      throw new Error('Queue name is required');
    }
    const awsConfig = this.config as AWSQueueConfig;
    if (!awsConfig.region) {
      throw new Error('AWS region is required');
    }
  }

  protected async setupQueue(): Promise<void> {
    // AWS SQS queues are created automatically when sending messages
    // No setup needed
  }

  async enqueue(task: Task, options?: TaskOptions): Promise<string> {
    // Validate the task
    if (!task.type) {
      throw new Error('Task must have a type (queue name)');
    }
    if (task.payload === undefined) {
      throw new Error('Task must have a payload property');
    }

    // Get the target URL from options or use the default
    const targetUrl = options?.targetUrl;
    if (!targetUrl) {
      throw new Error('Task must have a targetUrl in options');
    }

    // Create a message that includes the task type and payload
    const messageBody = {
      type: task.type,
      payload: task.payload,
      targetUrl: targetUrl
    };

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        'Task-Type': {
          DataType: 'String',
          StringValue: task.type,
        },
        'Task-Priority': {
          DataType: 'Number',
          StringValue: (options?.priority || 5).toString(),
        },
      },
      DelaySeconds: options?.scheduledFor
        ? Math.floor((options.scheduledFor - Date.now()) / 1000)
        : 0,
    });

    const response = await this.client.send(command);
    return response.MessageId || '';
  }

  async dequeue(): Promise<Task | null> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ['All'],
      WaitTimeSeconds: 20,
    });

    const response = await this.client.send(command);
    if (!response.Messages?.length) return null;

    const message = response.Messages[0];
    const task = JSON.parse(message.Body || '{}') as Task;
    task.id = message.MessageId || '';
    task.receiptHandle = message.ReceiptHandle;

    return task;
  }

  async acknowledge(taskId: string): Promise<void> {
    // AWS SQS handles acknowledgments via message deletion
    // This method is not needed for AWS implementation
  }

  async deadLetter(taskId: string, error: Error): Promise<void> {
    // AWS SQS handles dead lettering via redrive policy
    // This method is not needed for AWS implementation
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
    });

    const response = await this.client.send(command);
    const attributes = response.Attributes || {};

    return {
      pending: parseInt(attributes.ApproximateNumberOfMessages || '0'),
      processing: parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0'),
      completed: 0,
      failed: 0,
    };
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for AWS SQS
  }
} 