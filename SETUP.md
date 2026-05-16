# Setup Instructions

## Prerequisites

- Node.js 22+
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

## Quick Start

### 1. Clone and Install

```bash
cd anonbot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `BOT_TOKEN` - Get from @BotFather
- `TELEGRAM_BOT_USERNAME` - Your bot username
- `PAYMENT_PROVIDER_TOKEN` - For Telegram Stars (optional)

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Start with Docker

```bash
docker-compose up -d
```

### 5. Run Migrations

```bash
docker-compose exec app npm run db:migrate
```

### 6. Start the Bot

```bash
docker-compose exec app npm start
```

Or for development with hot reload:

```bash
npm run dev
```

## Manual Setup (without Docker)

### 1. Start PostgreSQL

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=anonbot \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=anonbot \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Start Redis

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 3. Update .env

```
DATABASE_URL=postgresql://anonbot:changeme@localhost:5432/anonbot
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Run

```bash
npm install
npm run db:generate
npm run db:migrate
npm run build
npm start
```

## Testing

```bash
npm test
```

## Project Structure

```
anonbot/
├── src/
│   ├── bot/           # Bot handlers, commands, keyboards
│   ├── config/        # Environment, logger, database config
│   ├── jobs/          # Background jobs
│   ├── repositories/ # Database repositories
│   ├── services/     # Business logic services
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── prisma/            # Database schema
├── docker/            # Docker configs
└── .env.example       # Environment template
```