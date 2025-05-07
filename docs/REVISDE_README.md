


# Feathers-Queue: Cloud-Neutral Task Queue for Feathers.js

## Overview

Feathers-Queue is a **cloud-neutral, distributed task queue** designed for **Feathers.js applications**. It supports **Google Cloud Tasks, AWS SQS, and Azure Queue Storage**, ensuring flexibility across cloud providers. This module enables task offloading, **at-least-once or exactly-once processing**, retries, and **throttling**, while allowing Feathers.js services to act as both producers and workers.

### Features
- 🌍 **Cloud-neutral**: Supports GCP, AWS, and Azure queues.
- ⚡ **Asynchronous task processing**: Offload heavy tasks and scale dynamically.
- 🔄 **Retry & Dead Letter Queue (DLQ)**: Automatic retries for failed tasks.
- ⏳ **Task scheduling & throttling**: Prevent system overload.
- 🛠 **Cloud Tasks Emulator**: Local development without cloud dependencies.

---

## 1️⃣ Installation

```sh
npm install feathers-queue @google-cloud/tasks aws-sdk azure-storage-queue
```

For local development with the Cloud Tasks emulator:
```sh
npm install --save-dev @google-cloud/tasks-emulator
```

---

## 2️⃣ Project Structure

```plaintext
/feathers-queue
├── src/
│   ├── queue.js        # Core queue implementation
│   ├── providers/
│   │   ├── gcp.js      # Google Cloud Tasks provider
│   │   ├── aws.js      # AWS SQS provider
│   │   ├── azure.js    # Azure Queue Storage provider
├── examples/
│   ├── feathers-app/   # Sample Feathers.js integration
├── tests/
│   ├── test-queue.js   # Unit tests
└── README.md
```

---

## 3️⃣ Usage

### **3.1 Initializing the Queue**

```js
const FeathersQueue = require("feathers-queue");
const queue = new FeathersQueue({
  provider: "gcp", // or "aws", "azure"
  config: {
    projectId: "my-gcp-project",
    queueName: "task-queue",
  },
});
```

### **3.2 Enqueue a Task**

```js
await queue.addTask({
  name: "process-document",
  data: { fileId: "123.pdf" },
  delaySeconds: 10, // Optional delay
});
```

### **3.3 Processing Tasks**

Your Feathers.js service should expose an endpoint (`POST /tasks`) that Cloud Tasks/SQS/Azure will call when processing a task.

```js
app.post("/tasks", async (req, res) => {
  const { name, data } = req.body;
  console.log(`Processing task: ${name}`, data);

  try {
    await processTask(name, data);
    res.status(200).send("Task completed");
  } catch (err) {
    console.error("Task failed", err);
    res.status(500).send("Retry later");
  }
});
```

---

## 4️⃣ Provider-Specific Configurations

### **4.1 Google Cloud Tasks**

```js
const queue = new FeathersQueue({
  provider: "gcp",
  config: {
    projectId: "my-project",
    queueName: "feathers-tasks",
    location: "us-central1",
  },
});
```

### **4.2 AWS SQS**

```js
const queue = new FeathersQueue({
  provider: "aws",
  config: {
    queueUrl: "https://sqs.us-east-1.amazonaws.com/1234567890/my-queue",
    region: "us-east-1",
  },
});
```

### **4.3 Azure Queue Storage**

```js
const queue = new FeathersQueue({
  provider: "azure",
  config: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    queueName: "feathers-queue",
  },
});
```

---

## 5️⃣ Cloud Tasks Emulator (Local Development)

### **5.1 Start Emulator**

```sh
npx @google-cloud/tasks-emulator start --port=8123
```

### **5.2 Connect Feathers-Queue to Emulator**

```js
const queue = new FeathersQueue({
  provider: "gcp",
  config: {
    projectId: "dev-project",
    queueName: "local-queue",
    location: "us-central1",
    apiEndpoint: "http://localhost:8123",
  },
});
```

---

## 6️⃣ Handling Retries & Dead Letter Queues

### **6.1 Configure Retry Policy** (Example for GCP)
```js
const queue = new FeathersQueue({
  provider: "gcp",
  config: {
    queueName: "task-queue",
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 10,
      maxBackoffSeconds: 300,
    },
  },
});
```

### **6.2 Dead Letter Queue**

For GCP, set up a DLQ:
```sh
gcloud tasks queues update my-queue \
    --dead-letter-queue=projects/my-project/locations/us-central1/queues/dlq \
    --max-retry-attempts=5
```

For AWS, use an SQS DLQ:
```js
const sqs = new AWS.SQS();
const params = {
  QueueUrl: "https://sqs.us-east-1.amazonaws.com/1234567890/my-queue",
  RedrivePolicy: JSON.stringify({
    deadLetterTargetArn: "arn:aws:sqs:us-east-1:1234567890:my-dlq",
    maxReceiveCount: 5,
  }),
};
sqs.setQueueAttributes(params);
```

---

## 7️⃣ Next Steps

- **✅ Implement Feathers.js integration** in your app.
- **📊 Add monitoring** using OpenTelemetry or Cloud Logs.
- **🚀 Optimize task execution** (batch processing, rate limiting, etc.).

---

## 🚀 Conclusion

Feathers-Queue provides **cloud-neutral task processing** for Feathers.js. Whether you're using **Google Cloud Tasks, AWS SQS, or Azure Queue Storage**, this module abstracts away cloud-specific differences so your app remains flexible.

### **🔥 Let’s Build!**
Want more features? Contributions & feedback are welcome!

```sh
git clone https://github.com/your-org/feathers-queue.git
```

