# Project Startup Guide

This document outlines the steps to start each service of the Job Scheduler application.

## Starting Services with Docker Compose (backend, llm-service, llama-server, db)

All services except the `frontend` are started using Docker Compose.

1.  **Navigate to the project root directory**
    ```bash
    cd C:\Users\b0949\Desktop\develop\job-scheduler-app
    ```

2.  **Start services with Docker Compose**
    ```bash
    docker-compose up --build -d
    ```
    *   `up`: Starts the services.
    *   `--build`: Rebuilds images if there are changes to the Dockerfile or for the first startup.
    *   `-d`: Starts services in the background.

    This will start the `backend`, `llm-service`, `llama-server`, and `db` services.

## Local Frontend Startup

The Frontend is started directly in the local environment, not with Docker Compose.

1.  **Navigate to the frontend directory**
    ```bash
    cd frontend
    ```

2.  **Install necessary packages**
    ```bash
    npm install
    ```

3.  **Start the Frontend**
    ```bash
    npm run dev
    ```
    This command will start the Frontend development server on port 3000.