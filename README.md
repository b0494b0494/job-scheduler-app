# Job Scheduler App

This is a web application for scheduling jobs, with features for collecting and analyzing feedback using a local LLM.

## Architecture

The application is composed of several services orchestrated using Docker Compose. For a detailed architecture overview, please refer to `ARCHITECTURE.md`.

## Getting Started

For detailed instructions on how to set up and run the project, please refer to `STARTUP.md`.

## Observability (OpenTelemetry & Phoenix)

This project integrates OpenTelemetry for distributed tracing, metrics, and logs, with data visualized using Arize AI Phoenix. The LLM Service is instrumented to provide detailed insights into LLM calls, including prompts and responses visible in the 'input' and 'output' columns of Phoenix.

- **Phoenix UI**: [http://localhost:6006](http://localhost:6006)

## Usage

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **LLM Service**: [http://localhost:8000](http://localhost:8000)
