#!/bin/bash

# Set environment variable to indicate we're running in Docker
export DOCKER_ENV=true

# Run the tests
npm run test:e2e 