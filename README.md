# Docky

**Chat with your documents using local AI — fully self-hosted, privacy-first RAG platform.**

Docky is an open-source, full-stack application that lets you upload documents, index them into a vector database, and have intelligent conversations about their content - all powered by local LLMs running on your own hardware. No data leaves your machine.

---

## Features

- **RAG-powered chat** - Ask questions about your documents and get context-aware answers with source references
- **Document upload & parsing** - Upload PDFs and other documents, automatically parsed via [Docling](https://github.com/docling-project/docling)
- **Local LLM inference** - Runs entirely self-hosted with [Ollama](https://ollama.com) - no API keys, no cloud dependencies
- **Multi-user chat system** - Create chats, invite users, attach documents, and collaborate
- **Chat history** - Full conversation history maintained during inference for coherent multi-turn dialogues
- **Authentication** - Secure OAuth2 + JWT token-based auth with Argon2 password hashing
- **Async task processing** - Document indexing and LLM queries run asynchronously via Celery workers
- **One-command deployment** — Full Docker Compose stack - spin up the entire platform in minutes

---

## Tech Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Backend**        | Python 3.13 · FastAPI · SQLModel · Celery                        |
| **Frontend**       | React 19 · Vite · Tailwind CSS · React Router                   |
| **AI / ML**        | LlamaIndex · Ollama · Qdrant · Docling                          |
| **Database**       | PostgreSQL 17                                                    |
| **Object Storage** | MinIO (S3-compatible)                                            |
| **Message Broker** | RabbitMQ                                                         |
| **Auth**           | OAuth2 · JWT · Argon2 (via pwdlib)                               |
| **Observability**  | Arize Phoenix (LLM tracing & evals)                              |
| **DevOps**         | Docker · Docker Compose · uv (package manager)                   |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the repository

```bash
git clone https://github.com/danilonok/docky.git
cd docky
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
AUTH_SECRET_KEY=your-secret-key-here
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password123
```

### 3. Start the stack

```bash
docker compose up -d
```

This brings up all services:

| Service         | URL                          |
| --------------- | ---------------------------- |
| **API**         | http://localhost:8000        |
| **API Docs**    | http://localhost:8000/docs   |
| **Adminer**     | http://localhost:8080        |
| **MinIO Console** | http://localhost:9001     |
| **Qdrant Dashboard** | http://localhost:6333/dashboard |

### 4. Pull an Ollama model

```bash
docker exec -it ollama_service ollama pull qwen3:4b
```

You're now ready to register a user and start chatting with your documents!

---

## API Overview

The REST API is fully documented via **OpenAPI / Swagger UI** at `/docs`. Key endpoint groups:

| Group          | Endpoints                                        | Description                              |
| -------------- | ------------------------------------------------ | ---------------------------------------- |
| **Auth**       | `POST /token`                                    | Obtain JWT access token                  |
| **Users**      | `GET /users/me` · `POST /users` · `DELETE /users` | Registration, profile, deletion         |
| **Chats**      | `GET /chats` · `POST /chats` · `DELETE /chats`   | Create and manage multi-user chats       |
| **Documents**  | `POST /documents/upload` · `GET /documents`      | Upload and list user documents           |
| **Messages**   | `GET /messages` · `POST /messages` · `DELETE /messages` | Send and retrieve chat messages    |
| **Tasks**      | `POST /generate` · `POST /add_document_to_index` · `POST /query` | Async LLM generation, indexing & RAG queries |

---

## License

This project is open source. See the [LICENSE](LICENSE) file for details.
