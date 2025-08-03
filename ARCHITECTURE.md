# Prototype Design and Architecture Overview

## 1. Application Overview

This prototype is a job scheduler application designed to efficiently manage and analyze feedback from casual interviews. It specifically leverages Large Language Models (LLMs) for automated feedback classification and provides a "brainstorming" feature to help users deepen their thoughts.

## 2. Key Components and Roles

The application consists of the following main components:

### 2.1. Frontend
- **Role:** Provides the user interface, accepts user input (e.g., scheduling, feedback entry, LLM interaction), and communicates with the Backend API.
- **Technology Stack:** Next.js (React), TypeScript, Material-UI (MUI)

### 2.2. Backend
- **Role:** Receives requests from the frontend, handles database operations, and relays requests to the LLM Service. It contains the core business logic.
- **Technology Stack:** Node.js (tRPC/Express.js), PostgreSQL (Database)

### 2.3. LLM Service (Python/FastAPI)
- **Technology:** Python, FastAPI
- **Role:** Provides an API for LLM-related functionalities, such as chat and feedback classification. It acts as an intermediary between the `backend` and the actual LLM server.
- **Communication:** Communicates with `llama-server` for LLM inference. Sends OpenTelemetry traces and logs to `otel-collector`.

### 2.4. Llama Server (Python/llama.cpp)
- **Technology:** Python, llama.cpp (for local LLM inference)
- **Role:** Hosts and serves the large language model (LLM) for inference requests.
- **Communication:** Exposes a REST API for the `llm-service`.

### 2.5. Database (PostgreSQL)
- **Technology:** PostgreSQL
- **Role:** Stores application data, including scheduled jobs and feedback.
- **Communication:** Accessed by the `backend` service.

### 2.6. Observability (OpenTelemetry Collector, Phoenix)
- **Technology:** OpenTelemetry Collector, Phoenix
- **Role:** Collects and processes telemetry data (traces, metrics, logs) from various services. Phoenix provides a UI for visualizing and analyzing LLM-specific traces and logs.
- **Communication:**
    - `llm-service` (and potentially other services in the future) sends OTLP (OpenTelemetry Protocol) data to `otel-collector`.
    - `otel-collector` processes and exports data to `phoenix`.

## 3. Data Flow Example (Job Scheduling)

- **Frontend ↔ Backend:** Communication via RESTful API over HTTP/HTTPS.
- **Backend ↔ Database:** The Backend accesses the database via an ORM (Sequelize).
- **Backend ↔ LLM Service:** The Backend calls the LLM Service API endpoints via HTTP requests.
- **LLM Service ↔ Llama Server:** The LLM Service calls the Llama Server API endpoints via HTTP requests (`httpx`) to perform LLM inference.
- **LLM Service ↔ OpenTelemetry Collector:** The LLM Service is instrumented with OpenTelemetry SDK and sends trace data in OTLP (OpenTelemetry Protocol) format to the OpenTelemetry Collector.
- **OpenTelemetry Collector ↔ Phoenix:** The OpenTelemetry Collector processes the received trace data and exports it to Phoenix's OTLP endpoint in a format understandable by Phoenix.

## 4. LLM Feature Details

The LLM Service provides the following two main functionalities:

### 4.1. Automated Feedback Classification
- **Purpose:** Automatically classifies user-entered feedback text into predefined categories (e.g., impressions, strengths, concerns, motivation, next steps, others) and returns it in a structured JSON format.
- **API Endpoint:** `POST /classify-feedback`
- **LLM Model:** `mistral-7b-instruct-v0.2.Q2_K.gguf` (GGUF format)
- **Internal Process:** Calls the LLM server via the `call_llm` function in `services/llm_service.py` and uses prompts loaded from `prompts/classify_feedback.py`.

### 4.2. Brainstorming Feature (Chat)
An interactive assistant feature to help users deepen their thoughts.

#### 4.2.1. Brainstorming Mode (Short Conversation)
- **Purpose:** Responds to short user statements with probing questions to encourage deeper thinking. It supports quick, interactive conversations to help users organize their thoughts.
- **API Endpoint:** `POST /chat`
- **Internal Process:** Calls the LLM server via the `call_llm` function in `services/llm_service.py` and uses system prompts loaded from `prompts/chat.py`.

#### 4.2.2. Analysis Mode (Conversation from Long Text Analysis)
- **Purpose:** The LLM analyzes long feedback text entered by the user and generates an initial question based on its content.
- **API Endpoint:** `POST /chat/analyze`
- **Internal Process:** This endpoint achieves complex analysis and question generation by **sequentially calling multiple LLM Service endpoints step-by-step** from the backend:
    1.  **Rephrasing Agent (`POST /chat/rephrase`):** Restructures the user's long text into more logical and readable Japanese sentences without losing the original intent.
        - **Internal Process:** Calls the LLM server via the `call_llm` function in `services/llm_service.py` and uses prompts loaded from `prompts/rephrase.py`.
    2.  **Deep Dive Question Agent (`POST /chat/deep_dive_questions`):** Generates deep-dive questions based on the rephrased text to prompt the user's thinking.
        - **Internal Process:** Calls the LLM server via the `call_llm` function in `services/llm_service.py` and uses prompts loaded from `prompts/deep_dive_questions.py`.
    3.  The backend combines the responses from these two agents to form the final response and sends it to the frontend.

## 5. Development Environment Overview

- **Docker Compose:** Manages the containerization and orchestration of Backend, Llama Server, LLM Service, OpenTelemetry Collector, Phoenix, and Database.
- **Local Development:** The Frontend is run directly in the local environment.