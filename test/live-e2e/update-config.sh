#!/bin/bash

# This script updates the example app's configuration with the ngrok URL

# Check if ngrok URL is provided
if [ -z "$1" ]; then
  echo "Error: Ngrok URL is required"
  echo "Usage: $0 <ngrok-url>"
  exit 1
fi

NGROK_URL=$1
EXAMPLE_DIR="example"
CONFIG_FILE="$EXAMPLE_DIR/config/default.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file not found at $CONFIG_FILE"
  exit 1
fi

# Update the taskHandlerUrl in the config file
echo "Updating taskHandlerUrl in $CONFIG_FILE to $NGROK_URL/gcp"
jq --arg url "$NGROK_URL/gcp" '.queue.taskHandlerUrl = $url' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "Configuration updated successfully" 