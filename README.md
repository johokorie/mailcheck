# MailCheck Backend - Node.js/Express Edition

A Node.js + Express rebuild of the Reacher email verification backend.

## Features

- **REST API** for email verification
- **Single email verification** (`/v0/check_email`, `/v1/check_email`)
- **Bulk email verification** with job tracking (`/v0/bulk`, `/v1/bulk`)
- **Rate limiting/throttling** (per second, minute, hour, day)
- **Postgres storage** for job results
- **RabbitMQ worker** support (optional, beta)
- **Header-based authentication** (optional)
- **Request validation** with Joi
- **Logging** with Pino
- **Docker support**

## Quick Start

### Docker (recommended)

```bash
docker-compose up
```

The server will be available at `http://localhost:8080`.

### Manual

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start the server
npm start
```

## Configuration

Configuration is loaded from:
1. `backend_config.toml` (TOML file)
2. Environment variables with `RCH__` prefix

Environment variables take precedence over the TOML file.

```bash
export RCH__HTTP_PORT=3000
export RCH__STORAGE__DB_URL=postgresql://localhost/reacherdb
export RCH__WORKER__ENABLE=true
```

## API Endpoints

### Single Email Verification

**POST** `/v0/check_email` or `/v1/check_email`

```json
{
  "to_email": "someone@gmail.com",
  "proxy": {
    "host": "my-proxy.io",
    "port": 1080,
    "username": "me",
    "password": "pass"
  }
}
```

### Bulk Email Verification

**POST** `/v0/bulk` or `/v1/bulk`

```json
{
  "emails": ["test1@gmail.com", "test2@yahoo.com"]
}
```

Returns:

```json
{
  "job_id": "uuid",
  "total_emails": 2,
  "status": "pending",
  "created_at": "2023-01-01T00:00:00Z"
}
```

**GET** `/v0/bulk/:job_id` or `/v1/bulk/:job_id/progress`

Returns job status and email count breakdown.

**GET** `/v0/bulk/:job_id/results` or `/v1/bulk/:job_id/results?limit=100&offset=0`

Returns paginated results.

## Development

```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Architecture

```
src/
  index.js              Express app entry point
  config.js             Configuration loader
  routes/
    v0/                 API v0 endpoints
      checkEmail.js
      bulk.js
    v1/                 API v1 endpoints (with throttling)
      checkEmail.js
      bulk.js
  services/
    emailService.js     Email verification logic
    bulkService.js      Bulk job management
  utils/
    logger.js           Pino logger
    db.js               Postgres & RabbitMQ connections
    auth.js             Header secret middleware
    throttle.js         Rate limiting manager
    errors.js           Custom error classes
```

## Database Schema

Required tables:

```sql
CREATE TABLE bulk_jobs (
  id UUID PRIMARY KEY,
  total_emails INT,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE bulk_emails (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES bulk_jobs(id),
  email VARCHAR(255),
  status VARCHAR(50),
  result JSONB,
  created_at TIMESTAMP
);
```

## Next Steps

1. **Integration**: Connect to the Rust email verification library
   - Via Node native addon (NAPI)
   - Via child process / HTTP to Rust backend
   - Via FFI bindings

2. **Database Migrations**: Set up initial schema

3. **Tests**: Add unit and integration tests

4. **Production**: Deploy with proper monitoring and error tracking

## License

AGPL-3.0
