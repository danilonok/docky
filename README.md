# Docky

**Chat with your documents using local AI – fully self-hosted, privacy-first RAG platform.**

Docky is an open-source, full-stack application that lets you upload documents, index them into a vector database, and have intelligent conversations about their content - all powered by local LLMs running on your own hardware. No data leaves your machine.

---

<img width="2778" height="1654" alt="image" src="https://github.com/user-attachments/assets/88f72888-c27e-44e9-a53a-6015326dfd68" />


## Features

- **RAG-powered chat** - Ask questions about your documents and get context-aware answers with source references
- **Document upload & parsing** - Upload PDFs and other documents, chunked via [Docling](https://github.com/docling-project/docling)'s hybrid chunker
- **Local LLM inference** - Runs entirely self-hosted with [Ollama](https://ollama.com) - no API keys, no cloud dependencies
- **Multi-user chats** - Create chats, add users, attach documents, and collaborate
- **Chat history** - The most recent turns are replayed into the model for coherent multi-turn dialogues
- **Authentication & authorization** - OAuth2 + JWT with Argon2 password hashing; every chat, document, and message route resolves ownership or chat membership through a shared dependency
- **Rate limiting** - Per-IP limits on login, registration, message sending, and document attachment
- **Async task processing** - Document indexing and LLM queries run asynchronously via Celery workers
- **One-command deployment** — Full Docker Compose stack - spin up the entire platform in minutes

---

## How it works

```
upload → MinIO (original file)
       → Celery → Docling (hybrid chunking) → Ollama (embeddings) → Qdrant

ask    → POST /messages → Celery → Qdrant retrieval (filtered by chat_id)
       → Ollama (ContextChatEngine + recent history) → reply written back to Postgres
```

Vectors live in a single Qdrant collection (`documents`) and are partitioned per chat by a
`chat_id` metadata filter, so attaching a document to a chat is what grants its members access
to that content.

---

## Tech Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Backend**        | Python 3.13 · FastAPI · SQLAlchemy 2.0 · Alembic · Celery        |
| **Frontend**       | React 19 · Vite · Tailwind CSS · React Router                    |
| **AI / ML**        | LlamaIndex · Ollama · Qdrant · Docling                           |
| **Database**       | PostgreSQL 17                                                    |
| **Object Storage** | MinIO (S3-compatible, via boto3)                                 |
| **Message Broker** | RabbitMQ                                                         |
| **Auth**           | OAuth2 · JWT · Argon2 (via pwdlib) · slowapi rate limiting       |
| **DevOps**         | Docker · Docker Compose · uv (package manager)                   |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- An NVIDIA GPU with the [container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) — the `ollama` service in
  [docker-compose.yml](docker-compose.yml) reserves GPU devices. Drop that `deploy.resources`
  block to run CPU-only.

### 1. Clone the repository

```bash
git clone https://github.com/danilonok/docky.git
cd docky
```

### 2. Configure environment variables

Every credential and hostname is read from the environment — nothing is hardcoded. Create a
`.env` file in the project root; the host values below are the Compose service names, which is
what the containers use to reach each other.

```env
AUTH_SECRET_KEY=your-secret-key-here

POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=db

MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password123
AWS_HOST=minio

OLLAMA_HOST=ollama
QDRANT_HOST=qdrant
DOCLING_HOST=docling
RABBIT_MQ_HOST=rabbitmq
```

`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are what the app authenticates to MinIO with, so
they must match `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` (or a MinIO access key you created).
The values above are throwaway development placeholders — generate real ones for any deployment
that is reachable from outside your machine. `.env` is gitignored; CI injects the same variable
names from repository secrets.

### 3. Start the stack

```bash
docker compose up -d
```

This brings up all services:

| Service              | URL                             |
| -------------------- | ------------------------------- |
| **API**              | http://localhost:8980           |
| **API Docs**         | http://localhost:8980/docs      |
| **Adminer**          | http://localhost:8080           |
| **MinIO Console**    | http://localhost:9001           |
| **Qdrant Dashboard** | http://localhost:6333/dashboard |
| **Docling UI**       | http://localhost:5001           |
| **PostgreSQL**       | localhost:5432                  |
| **RabbitMQ**         | localhost:5672                  |

### 4. Pull the Ollama models

Docky uses a small instruction model for generation and a separate embedding model:

```bash
docker exec -it ollama_service ollama pull gemma3:1b-it-q4_K_M
docker exec -it ollama_service ollama pull embeddinggemma
```

Both names are set in [app/tasks/nodes/nodes.py](app/tasks/nodes/nodes.py) — swap in a larger
model there if your hardware allows, and pull whatever you point it at.

### 5. First-run setup

Three things are not yet automated and have to be done once.

**1. Create the application database.** The app connects to a database named `remindme`
([database.py:22](app/dependencies/database.py#L22)), which Postgres does not create for you:

```bash
docker exec -it postgres_db createdb -U postgres remindme
```

**2. Apply the schema.** Nothing runs `alembic upgrade head` on container start, so run it
yourself:

```bash
docker compose exec api alembic upgrade head
```

> ⚠️ Alembic currently points at a database named `db`
> ([alembic/env.py:13](alembic/env.py#L13)) while the app points at `remindme`. Until that is
> reconciled, make the two agree — either change the name in `env.py` to `remindme`, or create
> `db` instead and change `database.py`. Tracked in [BACKLOG.md](BACKLOG.md).

**3. Create the MinIO bucket** `my-bucket` via the console at http://localhost:9001.
`create_bucket` exists in [minio_client.py](app/storage/minio_client.py) but is never called, so
uploads return a 500 until the bucket is there.

You're now ready to register a user and start chatting with your documents.

---

## Development

### Backend

The project uses [uv](https://docs.astral.sh/uv/). Run everything through it — never call
`python`, `pip`, `alembic`, or `celery` directly.

```bash
uv sync                                       # install dependencies
uv run fastapi dev app/main.py                # API on http://localhost:8000
uv run celery -A app.tasks worker --loglevel=info -P solo
```

The backend still expects the supporting services (Postgres, MinIO, Qdrant, RabbitMQ, Ollama,
Docling) to be reachable, so point the `*_HOST` variables at `localhost` when running outside
Compose.

Migrations:

```bash
uv run alembic revision --autogenerate -m "<message>"
uv run alembic upgrade head
```

### Frontend

The React app in [frontend/app/](frontend/app/) is a prototype and is not part of the Compose
stack. Run it separately:

```bash
cd frontend/app
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8980` ([vite.config.js](frontend/app/vite.config.js)),
so the browser sees a same-origin API and CORS is never exercised in development.

---

## API Overview

The REST API is fully documented via **OpenAPI / Swagger UI** at `/docs`. All routes except
`POST /token` and `POST /users` require a `Bearer` token.

| Group         | Endpoints                                                                                                                                            | Description                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Auth**      | `POST /token`                                                                                                                                          | Obtain a JWT access token                |
| **Users**     | `POST /users` · `GET /users/me` · `DELETE /users`                                                                                                      | Registration, profile, deletion          |
| **Chats**     | `GET /chats` · `POST /chats` · `GET /chats/{chatId}` · `DELETE /chats/{chatId}`                                                                        | Create and manage multi-user chats       |
| **Chat docs** | `GET /chats/{chatId}/documents` · `POST /chats/{chatId}/documents` · `DELETE /chats/{chatId}/documents`                                                 | Attach, list, and clear chat documents   |
| **Documents** | `POST /documents/upload` · `GET /documents`                                                                                                            | Upload and list your documents           |
| **Messages**  | `GET /messages?chatId=` · `POST /messages?chatId=` · `DELETE /messages?messageId=`                                                                     | Send and retrieve chat messages          |
| **Tasks**     | `POST /add_document_to_index` · `GET /add_document_to_index?task_id=`                                                                                  | Dispatch indexing and poll task status   |

Posting a message returns immediately with the stored user message; the assistant's reply is
produced by a Celery worker and appears in `GET /messages` once the job finishes.

Note that identifiers are named inconsistently on the wire today — the chats and messages routes
use camelCase (`chatId`, `documentId`, `messageId`) while the tasks and users routes use
snake_case (`document_id`, `chat_id`, `task_id`, `user_id`). Converging on snake_case is tracked
in the backlog.

---

## Project status

Docky is under active development and is not production-ready. Known gaps — failed indexing and
LLM jobs are not surfaced to the user, deletions do not cascade to MinIO or Qdrant, and there is
no test suite yet — are tracked with priorities in [BACKLOG.md](BACKLOG.md).

---

## License

This project is open source. See the [LICENSE](LICENSE) file for details.
