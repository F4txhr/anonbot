# Deployment Guide

## Production Deployment

### 1. Prepare Server

Ensure you have:
- Docker 20.10+
- Docker Compose 2.0+
- At least 1GB RAM
- Ports 3000, 5432, 6379 available

### 2. Configure Environment

```bash
cp .env.example .env
```

Required settings:
```env
BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://user:password@postgres:5432/anonbot
REDIS_HOST=redis
REDIS_PORT=6379
NODE_ENV=production
LOG_LEVEL=info

# Telegram Payments (optional)
PAYMENT_PROVIDER_TOKEN=your_provider_token

# Admin
ADMIN_USER_IDS=123456789,987654321

# Security (generate a secure string)
SESSION_SECRET=your_secure_random_string_min_32_chars
```

### 3. Build and Deploy

```bash
# Build the image
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 4. Database Setup

The first time you run, create the database:

```bash
# If using docker-compose
docker-compose exec postgres psql -U anonbot -c "CREATE DATABASE anonbot;"

# Run migrations
docker-compose exec app npm run db:migrate
```

### 5. Verify

```bash
# Check bot is running
curl http://localhost:3000/health

# Check logs
docker-compose logs app
```

## Updating

```bash
# Pull latest changes
git pull

# Rebuild
docker-compose build

# Restart
docker-compose restart app
```

## Monitoring

### Logs
```bash
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Health Checks
```bash
# App
curl http://localhost:3000/health

# PostgreSQL
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping
```

## Backup

### Database
```bash
docker-compose exec postgres pg_dump -U anonbot anonbot > backup.sql
```

### Redis
```bash
docker-compose exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb ./dump.rdb
```

## Troubleshooting

### Bot not responding
```bash
# Check logs
docker-compose logs app

# Restart
docker-compose restart app
```

### Database connection issues
```bash
# Check PostgreSQL
docker-compose logs postgres

# Verify connection
docker-compose exec app nc -zv postgres 5432
```

### Redis issues
```bash
# Check Redis
docker-compose logs redis

# Verify connection
docker-compose exec app nc -zv redis 6379
```

## Scaling

For horizontal scaling:
- Use external Redis (e.g., Redis Cloud)
- Use external PostgreSQL
- Run multiple bot instances with load balancer
- Configure BullMQ for distributed processing

## Security

1. Change default passwords in `.env`
2. Use strong `SESSION_SECRET`
3. Enable firewall on server ports
4. Use HTTPS if exposing web endpoints
5. Regular backups
6. Monitor logs for suspicious activity