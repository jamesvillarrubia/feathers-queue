# Cloud-Neutral Task Queue for Feathers.js

## System Prompt for Agentic AI

### **Objective**
Develop a **cloud-agnostic task queue** for **Feathers.js**, enabling seamless **asynchronous processing**, **scalability**, and **fault tolerance** across multiple cloud providers (**GCP, AWS, Azure**). The queue must support:
- **At-least-once and exactly-once processing**
- **Throttling and rate-limiting**
- **Dead-letter queues** for failed tasks
- **Cloud Tasks emulator for local testing**
- **Cloud Run compatibility for worker services**
- **Support for different execution pipelines**

---

### **Instructions for Agent**

#### **1. Define Core Library Structure**
- Build an npm module (`@feathers-cloud/task-queue`) with a provider-agnostic API.
- Ensure modular support for **Google Cloud Tasks, AWS SQS, and Azure Queue Storage**.
- Implement **Feathers.js service wrappers** for integration.
- Ensure the library uses GCP, AWS, and Azure npm libraries wherever appropriate to prevent duplicate effort and keep the module code lightweight.

#### **2. Implement Cloud-Agnostic Queue Management**
- Abstract queue interactions behind a **common interface**.
- Enable **task dispatching to multiple cloud providers**.
- Support **FIFO and priority-based processing**.
- Ensure **workers are stateless Cloud Run containers**, but allow different endpoints per task type.

#### **3. Develop a Retry & Dead-Letter Queue System**
- Implement a **configurable retry policy** per task.
- Support automatic failure handling and **dead-letter queueing**.
- Ensure failed tasks are **logged and retried per configurable rules**.

#### **4. Implement Cloud Tasks Emulator for Local Testing**
- Develop a **local Cloud Tasks emulator** to allow testing without cloud dependencies.
- Enable task submission and processing **entirely locally**.

#### **5. Enable Observability & Logging**
- Provide hooks for **logging task execution**.
- Optionally integrate with **Feathers.js event logging**.

---

### **Expected Deliverables**
1. **`@feathers-cloud/task-queue` npm module** (exporting queue interface, task dispatcher, and worker logic).
2. **Feathers.js service wrappers** for queue management.
3. **Cloud Tasks emulator** for local development.
4. **Example configurations for GCP, AWS, and Azure**.
5. **Documentation & Usage Examples** (README + API reference).

---

### **Notes for Implementation**
- Assume the **same Cloud Run container** serves as both the queue worker and API.
- Use **Docker-based horizontal scaling**.
- Provide **configurable rate-limiting and scheduling** for task execution.
- Ensure the solution can handle **large document processing workflows**.

---

🚀 **Build a robust, cross-cloud queue system that enables Feathers.js to orchestrate scalable, reliable, and fault-tolerant workflows!**

