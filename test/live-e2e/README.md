# Live E2E Tests for Feathers Queue

This directory contains end-to-end tests for the Feathers Queue library that run against real cloud services.

## Prerequisites

Before running the E2E tests, you need:

1. A Google Cloud project with the Cloud Tasks API enabled
2. The [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
3. [ngrok](https://ngrok.com/download) installed
4. [jq](https://stedolan.github.io/jq/download/) installed (for JSON processing)

## Running the Tests

To run the E2E tests, use the `run-e2e-test.sh` script:

```bash
# Make the script executable
chmod +x run-e2e-test.sh

# Run the script with your project ID
./run-e2e-test.sh --project-id your-project-id
```

You can customize the test with additional options:

```bash
./run-e2e-test.sh \
  --project-id your-project-id \
  --location us-central1 \
  --queue-name feathers-queue-test \
  --example-dir ../example \
  --ngrok-port 4040 \
  --feathers-port 3030
```

## What the Test Does

1. Sets up a GCP Cloud Tasks queue (or uses an existing one)
2. Starts the Feathers.js example app
3. Sets up ngrok to expose the app to the internet
4. Triggers a task via a curl request to the `/gcp` endpoint
5. Waits for the task to be processed
6. Checks if the task was processed by querying the `/queue` endpoint
7. Cleans up by stopping the app and ngrok

## Troubleshooting

If you encounter issues with the tests:

1. Check that your GCP project and service account are set up correctly
2. Verify that the Cloud Tasks API is enabled
3. Make sure your ngrok URL is accessible from the internet
4. Check the logs for any error messages

## Notes

- The test assumes that the example app has a `/gcp` endpoint that can trigger tasks
- The test assumes that the example app has a `/queue` endpoint that returns queue statistics
- The test uses a fixed sleep time to wait for the task to be processed, which may need to be adjusted based on your environment 