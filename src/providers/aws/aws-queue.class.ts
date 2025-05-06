/**
 * @feathers-cloud/task-queue
 * 
 * AWS SQS implementation of the QueueInterface.
 */

import { BaseQueue } from '../../core/queue/base-queue.class';
import { QueueInterface, QueueOptions, SingleQueueConfig } from '../../core/interfaces/queue.interface';
import { Task, TaskResult, TaskOptions } from '../../core/types/task.types';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { Application } from '@feathersjs/feathers';

export class AWSQueue extends BaseQueue implements QueueInterface {
  private client: SQSClient;
  private queueUrl: string;
  protected config: SingleQueueConfig;

  constructor(options: QueueOptions) {
    super(options);
    
    // Extract AWS-specific configuration
    this.config = options.config || {
      provider: 'aws',
      projectId: '',
      location: '',
      allowedDomains: [],
      maxRetries: 3,
      retryDelay: 1000
    };
    
    this.client = new SQSClient({
      region: this.config.region,
      credentials: this.config.accessKeyId && this.config.secretAccessKey
        ? {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          }
        : undefined,
    });
    this.queueUrl = this.config.queueUrl || `https://sqs.${this.config.region}.amazonaws.com/queue/${this.config.name}`;
  }

  protected async validateConfig(): Promise<void> {
    if (!this.config.name) {
      throw new Error('Queue name is required');
    }
    if (!this.config.region) {
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