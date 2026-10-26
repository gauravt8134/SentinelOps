# SentinelOps

> Full-stack observability and auto-healing platform for servers, APIs, websites, and real-user experience.

SentinelOps is a T.Y. B.Sc. (IT) Semester V project by **Gaurav Thakare** and **Saurabh Kalgoankar**. It provides one dashboard for monitoring infrastructure and application health, investigating performance problems, and demonstrating automated recovery workflows.

## Why SentinelOps?

Administrators often need several tools to answer basic questions:

- Is a server online?
- Is CPU, RAM, or disk usage too high?
- Is an API slow or returning errors?
- Is a website reachable?
- Are users experiencing slow page loads?
- Did a failed service recover?

SentinelOps combines these signals in one React dashboard backed by FastAPI and PostgreSQL.

## Features

### Fleet management

- Register and monitor server nodes.
- Collect CPU, RAM, disk, network, uptime, processes, operating system, and Docker telemetry.
- Detect online/offline status from recent heartbeat timestamps.
- Search, filter, sort, and view detailed node history.
- Support monitoring across Radmin VPN `26.x.x.x` addresses.

### Application Performance Monitoring (APM)

- Capture backend request activity through FastAPI middleware.
- Track request volume, status codes, latency, and error rates.
- Compare endpoints and identify slow application routes.

### Synthetic monitoring

- Monitor websites and API endpoints on a schedule.
- Record HTTP status, response time, DNS, TCP, TLS, TTFB, and total timing.
- Detect unavailable or slow services before users report them.

### Real User Monitoring (RUM)

- Record frontend page views and load times.
- Display LCP, INP, CLS, browser share, and JavaScript exception summaries.

### Auto-healing workflow

- Detect failed synthetic checks.
- Apply cooldown logic to prevent repeated recovery loops.
- Demonstrate controlled recovery through a `/heal` workflow.
- Display recovery actions and outcomes.

### Operations UI

- Alerts and incidents
- Unified logs interface
- Auto-healing operations
- Security signals
- SaaS landing page
- Login/trial prototype
- Account settings

## Architecture

```text
Python telemetry agent
        |
        | JSON over HTTP / Radmin VPN
        v
FastAPI + Uvicorn backend
        |
        | SQLAlchemy
        v
PostgreSQL database
        ^
        | REST API
        |
React + Vite dashboard
```

### Data flow

1. The Python agent reads local machine statistics using `psutil`.
2. It creates a JSON payload containing a `server_id`.
3. It sends the payload to `POST /metrics`.
4. FastAPI validates the payload and stores it using SQLAlchemy.
5. PostgreSQL keeps the monitoring history.
6. React requests the data and displays cards, charts, tables, and status badges.
7. APScheduler performs periodic website checks and recovery evaluation.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Recharts, Lucide icons, CSS |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Database | PostgreSQL, SQLAlchemy, psycopg2 |
| Telemetry | Python, psutil, Requests, optional Docker SDK |
| Scheduling | APScheduler |
| Network | HTTP/REST and Radmin VPN |
| Development | Windows PowerShell, VS Code, GitHub |

## Project structure

```text
SentinelOps/
├── agent/                 # Python telemetry collector
│   └── collector.py
├── backend/
│   ├── app/
│   │   ├── api/           # server, metrics, website, APM and RUM routes
│   │   ├── core/          # config, middleware and scheduler
│   │   ├── db/            # database setup
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # website checking and scheduled services
│   ├── requirements.txt
│   └── .env               # local-only configuration
├── frontend/
│   └── src/
│       ├── components/    # cards, charts, sidebar and sparklines
│       └── pages/         # dashboard and monitoring pages
├── docs/
├── infra/
└── observability/
```

## Prerequisites

Install:

- Python 3.11 or newer
- Node.js and npm
- PostgreSQL
- Git
- Radmin VPN for multi-machine monitoring
- Docker Desktop only if container counts are required

## Database configuration

Create a PostgreSQL database named `sentinelops`, then create `backend/.env`:

```env
DATABASE_URL=postgresql://<username>:<password>@127.0.0.1:5432/sentinelops
```

Never commit real passwords, API keys, or private credentials.

## Run the backend

PowerShell Terminal 1:

```powershell
cd C:\Users\HP\OneDrive\Desktop\SentinelOps\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Useful URLs:

```text
API:      http://127.0.0.1:8000
Docs:     http://127.0.0.1:8000/docs
Health:   http://127.0.0.1:8000/health
```

For Radmin VPN access, allow TCP port `8000` through Windows Firewall and keep Uvicorn bound to `0.0.0.0`.

## Run the frontend

PowerShell Terminal 2:

```powershell
cd C:\Users\HP\OneDrive\Desktop\SentinelOps\frontend
npm install
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

The backend target is configured in `frontend/src/api.js`. For the current Radmin setup:

```javascript
baseURL: 'http://26.82.91.31:8000'
```

## Run the telemetry agent

PowerShell Terminal 3 on the monitored computer:

```powershell
cd C:\Users\HP\OneDrive\Desktop\SentinelOps\agent
pip install psutil requests
python collector.py
```

The agent configuration is in `agent/collector.py`:

```python
BACKEND_URL = "http://26.82.91.31:8000"
SERVER_ID = 1
```

`SERVER_ID` must match the server record in PostgreSQL. A successful agent run prints:

```text
Metrics sent successfully
```

## Important API routes

| Route | Purpose |
|---|---|
| `GET /servers` | List registered servers |
| `POST /servers` | Register a server |
| `GET /metrics/{server_id}` | Read ordered telemetry history |
| `POST /metrics` | Receive telemetry from an agent |
| `GET /websites` | List website monitors |
| `POST /websites` | Create a website monitor |
| `GET /apm/stats` | Read APM summaries |
| `POST /apm/ingest` | Ingest an APM event |
| `GET /rum/stats` | Read RUM summaries |
| `POST /rum/log` | Record a RUM event |
| `GET /docs` | FastAPI interactive API documentation |

## Understanding the Overview cards

- **Active Nodes**: nodes with a recent telemetry heartbeat.
- **Synthetic Checks**: healthy website/API monitors divided by total monitors.
- **Total Throughput**: total application requests recorded by APM.
- **System Error Rate**: failed application requests divided by total requests.

A server becomes offline when its latest heartbeat is older than the configured timeout, commonly 90 seconds.

## Current implementation status

Implemented:

- React/Vite observability dashboard
- FastAPI REST backend
- PostgreSQL persistence through SQLAlchemy
- Python live telemetry agent
- Radmin VPN telemetry communication
- Ordered metric history and heartbeat status
- Fleet management and node detail views
- APM, synthetic monitoring, and RUM pages
- Scheduler-based website checks
- Auto-healing workflow demonstration
- Landing page, operations navigation, settings, and professional dashboard UI

Prototype areas requiring more backend work before production:

- Login, trial, and account settings currently demonstrate frontend session behavior.
- Alerts, Logs, Security, and some Auto-Healing events use prototype dashboard data.
- Restart Agent is currently a UI workflow and does not directly start a Windows process.
- Production deployment needs secure authentication, authorization, notifications, audit logs, and stronger agent security.

## Future roadmap

### Short term

- Store alerts, logs, security events, and healing actions in PostgreSQL.
- Add configurable time ranges and thresholds.
- Move agent settings to environment variables.
- Install the agent as a Windows service.
- Add email, Telegram, Slack, or Teams notifications.

### Medium term

- Add JWT/OAuth authentication and role-based access control.
- Add HTTPS, API keys or mutual TLS, rate limiting, and signed agent payloads.
- Add incident acknowledgement, ownership, escalation, and maintenance windows.
- Add log ingestion, search, and retention policies.
- Add anomaly detection and service discovery.

### Long term

- Add a queue or streaming layer for thousands of agents.
- Add time-series storage and metric retention.
- Add distributed tracing and service dependency maps.
- Add multi-tenant workspaces.
- Add CI/CD, backups, disaster recovery, and production deployment.

## Presentation summary

```text
Collect -> Send -> Store -> Show -> Recover
```

> A Python agent collects machine telemetry, sends JSON to FastAPI over the network, SQLAlchemy stores it in PostgreSQL, React displays it in the dashboard, and the scheduler checks services and starts a controlled recovery workflow when failure rules match.

## Team

| Member | Contribution |
|---|---|
| Gaurav Thakare | Project lead, architecture, infrastructure, telemetry, backend and dashboard integration |
| Saurabh Kalgoankar | Frontend/backend development, testing and documentation |

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
