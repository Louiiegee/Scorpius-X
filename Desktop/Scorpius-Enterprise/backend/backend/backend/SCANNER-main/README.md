# 🦂 Scorpius Scanner

Scorpius is an advanced, plugin-driven smart contract vulnerability scanner designed for deep, comprehensive security analysis. It integrates static and dynamic analysis tools, symbolic execution, and powerful AI-driven insights to provide a multi-faceted view of contract security.

The system is built on a scalable, asynchronous architecture using a job queue, making it suitable for both local development and production environments.

### ✨ Key Features

- **Plugin-Driven Architecture**: Easily extend the scanner's capabilities by adding new detection plugins.
- **AI-Powered Analysis**: Leverages Large Language Models (like Claude 3) to analyze code, interpret findings, and provide human-like security assessments.
- **Simulation & Fuzzing**: Executes contracts in a forked environment using Foundry/Anvil to test for complex, state-dependent vulnerabilities.
- **Unified API**: A single, modern FastAPI interface to start scans, monitor progress, and retrieve detailed results.
- **Real-time Updates**: WebSocket support for pushing live scan progress to frontends.
- **Asynchronous & Scalable**: Built with `asyncio` and a Redis/RQ job queue to handle multiple concurrent scans efficiently.
- **Comprehensive Reporting**: Automatically generates detailed JSON and text reports for each scan.

### 🏗️ Architecture Overview

1.  **API Server (`api/server.py`)**: The main entry point. It receives scan requests, validates them, and pushes them onto the job queue. It also serves scan results and provides WebSocket connections.
2.  **Redis & RQ (Queue)**: Manages the queue of pending scan jobs, allowing the system to scale by adding more worker processes.
3.  **Worker (`cli.py worker`)**: A process that listens to the queue, picks up scan jobs, and passes them to the Orchestrator.
4.  **Orchestrator (`core/orchestrator.py`)**: The brain of the system. For each scan, it manages the entire lifecycle:
    - Sets up the scan context.
    - Runs all relevant scanner plugins.
    - Invokes the AI Analyzer.
    - Calculates a final risk score.
    - Triggers report generation.
    - Saves the final results to the database.
5.  **Plugins (`plugins/`)**: Individual, self-contained analysis modules (e.g., Slither, Bytecode Analysis, Reentrancy Simulation). Each implements the `ScannerPlugin` interface.
6.  **Database (PostgreSQL)**: Persistently stores all scan results and metadata.

### 🚀 Getting Started

#### Prerequisites

- Python 3.12+
- Docker & Docker Compose
- [Foundry (Anvil/Forge)](https://getfoundry.sh) installed and available in your `PATH`.

#### Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd scorpius-scanner
    ```

2.  **Run the setup script:**
    This will create a virtual environment, install all dependencies, and set up pre-commit hooks.
    ```bash
    bash scripts/setup.sh
    ```

3.  **Configure Environment:**
    Copy the example environment file and update it with your settings, especially your AI provider's API key.
    ```bash
    cp .env.example .env
    # Now, edit the .env file
    # nano .env
    ```

4.  **Start Services:**
    This command will start the PostgreSQL database and Redis using Docker.
    ```bash
    docker-compose up -d
    ```

5.  **Run Database Migrations:**
    The `init_db()` function in the API server will create the necessary tables on its first startup.

### Usage

You need at least two terminals open.

1.  **Start the API Server:**
    ```bash
    source .venv/bin/activate
    uvicorn scorpius_scanner.api.server:app --reload
    ```
    The API will be available at `http://localhost:8000`.

2.  **Start a Scan Worker:**
    In a new terminal:
    ```bash
    source .venv/bin/activate
    scorpius worker
    ```

3.  **Run a Scan (via CLI):**
    In another new terminal:
    ```bash
    source .venv/bin/activate
    # Quick scan with default plugins
    scorpius scan 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

    # Scan with specific plugins and simulation
    scorpius scan 0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe --plugin reentrancy-detector --plugin slither-static
    ```

4.  **Run a Scan (via API):**
    Use a tool like `curl` or Postman to send a `POST` request to `http://localhost:8000/scan`.

    ```bash
    curl -X POST "http://localhost:8000/scan" \
         -H "Content-Type: application/json" \
         -d '{
               "target": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
               "rpc_url": "https://ethereum.publicnode.com",
               "enable_ai": true,
               "enable_simulation": true
             }'
    ```

### 🔌 Available Plugins

To see a list of all installed and available scanner plugins, run:
```bash
scorpius plugins