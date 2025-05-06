import { spawn } from 'child_process';
import { createTestApp } from './test-app';
import { Task } from '../src/core/types/task.types';

async function main() {
  // Start the Cloud Tasks emulator
  const emulator = spawn('gcloud', [
    'beta', 'emulators', 'tasks', 'start',
    '--project=test-project',
    '--queue=test-queue',
    '--host-port=localhost:8080'
  ]);

  emulator.stdout.on('data', (data) => {
    console.log(`Emulator: ${data}`);
  });

  emulator.stderr.on('data', (data) => {
    console.error(`Emulator error: ${data}`);
  });

  // Start the task receiver
  const receiver = spawn('ts-node', ['test/task-receiver.ts']);

  receiver.stdout.on('data', (data) => {
    console.log(`Receiver: ${data}`);
  });

  receiver.stderr.on('data', (data) => {
    console.error(`Receiver error: ${data}`);
  });

  // Wait for both services to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create test app and send a task
  const app = await createTestApp();
  
  const task: Task = {
    type: 'test-task',
    data: {
      targetUrl: 'http://localhost:8080/tasks',
      payload: {
        message: 'Hello from Cloud Tasks!'
      }
    }
  };

  try {
    const result = await app.service('gcp-queue').create(task);
    console.log('Task created:', result);
  } catch (error) {
    console.error('Error creating task:', error);
  }

  // Keep the process running
  process.on('SIGINT', () => {
    emulator.kill();
    receiver.kill();
    process.exit();
  });
}

main().catch(console.error); 