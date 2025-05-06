#!/bin/bash

# Load configuration
CONFIG_FILE="$(dirname "$0")/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file not found at $CONFIG_FILE"
  exit 1
fi

# Default values from config
LOCATION=$(jq -r '.defaults.location' "$CONFIG_FILE")
QUEUE_NAME=$(jq -r '.defaults.queueName' "$CONFIG_FILE")
EXAMPLE_DIR=$(jq -r '.defaults.exampleDir' "$CONFIG_FILE")
NGROK_PORT=$(jq -r '.defaults.ngrokPort' "$CONFIG_FILE")
FEATHERS_PORT=$(jq -r '.defaults.feathersPort' "$CONFIG_FILE")
APP_STARTUP_TIMEOUT=$(jq -r '.timeouts.appStartup' "$CONFIG_FILE")
NGROK_STARTUP_TIMEOUT=$(jq -r '.timeouts.ngrokStartup' "$CONFIG_FILE")
TASK_PROCESSING_TIMEOUT=$(jq -r '.timeouts.taskProcessing' "$CONFIG_FILE")
TRIGGER_ENDPOINT=$(jq -r '.endpoints.trigger' "$CONFIG_FILE")
STATUS_ENDPOINT=$(jq -r '.endpoints.status' "$CONFIG_FILE")
GCP_PROJECT_ID=$(jq -r '.gcp.projectId' "$CONFIG_FILE")
SKIP_GCP_SETUP=$(jq -r '.skipGcpSetup // false' "$CONFIG_FILE")

# Default values
PROJECT_ID=$GCP_PROJECT_ID

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project-id)
      PROJECT_ID="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --queue-name)
      QUEUE_NAME="$2"
      shift 2
      ;;
    --example-dir)
      EXAMPLE_DIR="$2"
      shift 2
      ;;
    --ngrok-port)
      NGROK_PORT="$2"
      shift 2
      ;;
    --feathers-port)
      FEATHERS_PORT="$2"
      shift 2
      ;;
    --skip-gcp-setup)
      SKIP_GCP_SETUP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if project ID is provided
if [ -z "$PROJECT_ID" ] && [ "$SKIP_GCP_SETUP" != "true" ]; then
  echo "Error: Project ID is required. Use --project-id to specify it or --skip-gcp-setup to skip GCP setup."
  exit 1
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
for cmd in ngrok jq curl gcloud; do
  if ! command_exists "$cmd"; then
    echo "Error: $cmd is required but not installed."
    exit 1
  fi
done

# Function to handle cleanup on exit
cleanup() {
  echo "Cleaning up..."
  # Kill ngrok if it's running
  pkill -f "ngrok http $FEATHERS_PORT" || true
  # Kill the Feathers app if it's running
  pkill -f "node.*example" || true
}

# Set up trap for cleanup
trap cleanup EXIT

echo "Starting E2E test for Feathers Queue with GCP Cloud Tasks..."
echo "Project ID: $PROJECT_ID"
echo "Location: $LOCATION"
echo "Queue Name: $QUEUE_NAME"
echo "Example Directory: $EXAMPLE_DIR"

# Create or get the queue if not skipping GCP setup
if [ "$SKIP_GCP_SETUP" != "true" ]; then
  echo "Setting up GCP Cloud Tasks queue..."
  QUEUE_CONFIG=$(jq -r '.defaults.queueConfig | to_entries | map("--\(.key)=\(.value)") | join(" ")' "$CONFIG_FILE")
  gcloud tasks queues create "$QUEUE_NAME" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    $QUEUE_CONFIG || true
else
  echo "Skipping GCP Cloud Tasks setup..."
fi

# Start the Feathers app in the background
echo "Starting Feathers app..."
cd "$EXAMPLE_DIR" || exit 1
npm install
npm run dev &
FEATHERS_PID=$!

# Wait for the app to start
echo "Waiting for Feathers app to start..."
sleep "$APP_STARTUP_TIMEOUT"

# Start ngrok in the background
echo "Starting ngrok..."
ngrok http "$FEATHERS_PORT" > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
echo "Waiting for ngrok to start..."
sleep "$NGROK_STARTUP_TIMEOUT"

# Get the ngrok URL
NGROK_URL=$(curl -s "http://localhost:$NGROK_PORT/api/tunnels" | jq -r '.tunnels[0].public_url')
if [ -z "$NGROK_URL" ]; then
  echo "Error: Failed to get ngrok URL"
  exit 1
fi

echo "Ngrok URL: $NGROK_URL"

# Generate a unique task ID
TASK_ID="test-task-$(date +%s)"

# Trigger a task
echo "Triggering a task..."
curl -X POST "$NGROK_URL$TRIGGER_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test-task",
    "data": {
      "message": "Hello from E2E test"
    }
  }'

# Wait for the task to be processed
echo "Waiting for task to be processed..."
sleep "$TASK_PROCESSING_TIMEOUT"

# Check if the task was processed
echo "Checking task status..."
TASK_STATUS=$(curl -s "$NGROK_URL$STATUS_ENDPOINT" | jq -r '.stats.processed')

if [ "$TASK_STATUS" -gt 0 ]; then
  echo "Success: Task was processed!"
  exit 0
else
  echo "Error: Task was not processed"
  exit 1
fi 