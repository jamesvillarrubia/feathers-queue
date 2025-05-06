import { exec } from 'child_process';
import { promisify } from 'util';
import debug from 'debug';
import path from 'path';

const debugEmulator = debug('feathers:queue:emulator');
const execAsync = promisify(exec);

/**
 * Starts the Cloud Tasks emulator using Docker Compose
 * @returns Promise that resolves when the emulator is ready
 */
export async function startEmulator(): Promise<void> {
  debugEmulator('Starting Cloud Tasks emulator with Docker Compose...');
  
  try {
    // Stop any existing emulator first
    await stopEmulator();
    
    // Start the emulator using Docker Compose
    const { stdout, stderr } = await execAsync('docker-compose up -d cloud-tasks-emulator');
    debugEmulator('[Docker Compose] %s', stdout);
    if (stderr) debugEmulator('[Docker Compose Error] %s', stderr);
    
    // Wait for the emulator to be healthy
    await waitForEmulator();
    
    debugEmulator('Emulator is ready!');
  } catch (error) {
    debugEmulator('[Emulator Error] %s', error);
    throw error;
  }
}

/**
 * Checks if the emulator is accepting connections
 * @param retries Number of times to retry
 * @returns Promise that resolves when the emulator is ready
 */
export async function waitForEmulator(retries = 5): Promise<void> {
  debugEmulator('Waiting for emulator to be ready...');
  
  for (let i = 0; i < retries; i++) {
    try {
      // Check if the container is healthy
      const { stdout } = await execAsync('docker-compose ps cloud-tasks-emulator --format json');
      const containerInfo = JSON.parse(stdout);
      
      if (containerInfo[0]?.Health === 'healthy') {
        debugEmulator('Emulator is healthy');
        return;
      }
      
      debugEmulator(`Attempt ${i + 1}/${retries} - Container not healthy yet, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      debugEmulator(`Attempt ${i + 1}/${retries} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Emulator is not healthy after multiple attempts');
}

/**
 * Stops the Cloud Tasks emulator using Docker Compose
 */
export async function stopEmulator(): Promise<void> {
  debugEmulator('Stopping Cloud Tasks emulator...');
  
  try {
    const { stdout, stderr } = await execAsync('docker-compose down cloud-tasks-emulator');
    debugEmulator('[Docker Compose] %s', stdout);
    if (stderr) debugEmulator('[Docker Compose Error] %s', stderr);
    debugEmulator('Emulator stopped');
  } catch (error) {
    debugEmulator('Error stopping emulator: %s', error);
    // Don't throw the error as this is cleanup code
  }
}