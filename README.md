# Job Scheduler App

This is a web application for scheduling jobs, with features for collecting and analyzing feedback using a local LLM.

## Architecture

The application is composed of the following services:

- **Frontend**: A [Next.js](https://nextjs.org/) application with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/).
- **Backend**: A [Node.js](https://nodejs.org/) application with [Express.js](https://expressjs.com/) and [Sequelize](https://sequelize.org/) for database interaction.
- **LLM Service**: A [Python](https://www.python.org/) service using [FastAPI](https://fastapi.tiangolo.com/) to serve a local Large Language Model.
- **Database**: A [PostgreSQL](https://www.postgresql.org/) database.

These services are orchestrated using [Docker Compose](https://docs.docker.com/compose/).

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/en/download/) (for local development)
- [Python](https://www.python.org/downloads/) (for the LLM service)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd job-scheduler-app
    ```

2.  **Set up environment variables:**

    Create `.env` files for the backend and frontend by copying the example files.

    For the backend:
    ```bash
    cp backend/.env.example backend/.env
    ```
    Update `backend/.env` with your local database settings if they differ from the defaults.

    For the frontend:
    ```bash
    cp frontend/.env.example frontend/.env.local
    ```

3.  **Build and run with Docker Compose:**

    This command will build and start the `db` and `backend` services.
    ```bash
    docker-compose up --build -d
    ```

4.  **Install frontend dependencies and run:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Running the LLM Service (Locally)

The LLM service is designed to run on the host machine to utilize local hardware resources (like a GPU).

1.  **Install dependencies:**
    ```bash
    cd llm-service
    # Create and activate a virtual environment
    python -m venv ../venv-llm
    source ../venv-llm/bin/activate
    pip install -r requirements.txt
    ```

2.  **Download a model:**
    Download a GGUF-compatible model (e.g., from [Hugging Face](https://huggingface.co/models?search=gguf)) and place it in the `llm-service/models` directory.

3.  **Start the service:**
    Before starting, ensure no other process is using port 8000.
    ```bash
    # Kill existing uvicorn processes if any
    ps aux | grep "uvicorn main:app" | grep -v "grep" | awk '{print $2}' | xargs kill -9

    # Start the service
    uvicorn llm-service.main:app --host 0.0.0.0 --port 8000
    ```

## Usage

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **LLM Service**: [http://localhost:8000](http://localhost:8000)
