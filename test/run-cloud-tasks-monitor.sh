#!/bin/bash

# Check if NGROK_URL is set
if [ -z "$NGROK_URL" ]; then
  echo "Error: NGROK_URL environment variable is not set"
  echo "Please set it to your ngrok URL (e.g., export NGROK_URL=https://your-ngrok-url.ngrok.io)"
  exit 1
fi

# Run the StepCI test
echo "Starting Cloud Tasks monitor..."
echo "Monitoring URL: $NGROK_URL"
echo "Press Ctrl+C to stop"

stepci run test/cloud-tasks-monitor.yaml 