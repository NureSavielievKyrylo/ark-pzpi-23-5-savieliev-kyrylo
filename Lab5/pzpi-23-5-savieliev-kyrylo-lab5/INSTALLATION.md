# Inkly Installation Guide

## Quick Start (Recommended)

Download Inkly and run locally:

```bash
wget https://raw.githubusercontent.com/OneLiL05/inkly-backend/main/install.sh
chmod +x install.sh
./install.sh
```

The installation script will:

- ✅ Check for Docker and Docker Compose
- ✅ Interactively configure your settings
- ✅ Generate secure random passwords
- ✅ Create `.env` file with your configuration
- ✅ Pull and build Docker images
- ✅ Start all services

---

## Prerequisites

Before installation, ensure you have:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Bash** shell
- **OpenSSL** (for generating secure passwords)

### Installing Prerequisites

**Ubuntu/Debian:**

```bash
curl -fsSL https://get.docker.com | bash
```

**macOS:**

```bash
brew install docker docker-compose
```

**Windows:**
Download Docker Desktop from https://www.docker.com/products/docker-desktop

---

## Interactive Installation

When you run `install.sh`, you'll be prompted for the following:

### 1. Basic Configuration

- **Port**: Port for the API server (default: `3000`)
- **Allowed Origins**: CORS allowed origins (default: `http://localhost:3000`)

### 2. PostgreSQL Configuration

- **Username**: PostgreSQL username (default: `inkly`)
- **Database**: Database name (default: `inkly`)
- **Password**: PostgreSQL password (auto-generated if not provided)

### 3. Redis Configuration

- **Username**: Redis username (default: `default`)
- **Password**: Redis password (auto-generated if not provided)

### 4. AWS S3 Configuration

- **Region**: AWS region (default: `us-east-1`)
- **Bucket Name**: Your S3 bucket name
- **Access Key ID**: AWS access key
- **Secret Access Key**: AWS secret key

> **Note**: You can leave AWS credentials empty and configure them later by editing the `.env` file.

### 5. Security Secrets

The script automatically generates secure random secrets for:

- Cookie encryption
- Authentication tokens

---

## Manual Installation

If you prefer to install manually:

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/inkly-server.git
cd inkly-server
```

### Step 2: Create `.env` File

Copy the example configuration:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```bash
nano .env
# or
vim .env
```

Generate secure passwords:

```bash
# Generate random password
openssl rand -base64 32
```

### Step 3: Start Services

Pull images and start:

```bash
# Pull pre-built images
docker-compose pull

# Build API image
docker-compose build api

# Start all services
docker-compose up -d
```

### Step 4: Verify Installation

Check if services are running:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs -f
```

---

## Configuration Options

### Environment Variables

| Variable                | Description              | Default                 | Required |
| ----------------------- | ------------------------ | ----------------------- | -------- |
| `PORT`                  | API server port          | `3000`                  | Yes      |
| `ALLOWED_ORIGINS`       | CORS allowed origins     | `http://localhost:3000` | Yes      |
| `POSTGRES_HOST`         | PostgreSQL host          | `db`                    | Yes      |
| `POSTGRES_DB`           | Database name            | `inkly`                 | Yes      |
| `POSTGRES_USER`         | Database username        | `inkly`                 | Yes      |
| `POSTGRES_PASSWORD`     | Database password        | -                       | Yes      |
| `REDIS_HOST`            | Redis host               | `redis`                 | Yes      |
| `REDIS_USER`            | Redis username           | `default`               | Yes      |
| `REDIS_PASSWORD`        | Redis password           | -                       | Yes      |
| `AWS_REGION`            | AWS region               | `us-east-1`             | Yes      |
| `AWS_S3_BUCKET`         | S3 bucket name           | -                       | Yes      |
| `AWS_ACCESS_KEY_ID`     | AWS access key           | -                       | Yes      |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key           | -                       | Yes      |
| `COOKIE_SECRET`         | Cookie encryption secret | -                       | Yes      |
| `BETTER_AUTH_SECRET`    | Auth token secret        | -                       | Yes      |

---

## Post-Installation

### Access the API

After installation, the API will be available at:

```
http://localhost:3000
```

(or the port you configured)

### Run Database Migrations

If needed, run migrations:

```bash
docker-compose exec api npm run migrate
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f db
docker-compose logs -f redis
```

### Check Service Status

```bash
docker-compose ps
```

---

## Useful Commands

### Start Services

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose stop
```

### Restart Services

```bash
docker-compose restart
```

### Stop and Remove Containers

```bash
docker-compose down
```

### Rebuild API Image

```bash
docker-compose build api
docker-compose up -d api
```

### Update to Latest Version

```bash
# Pull latest images
docker-compose pull

# Rebuild API
docker-compose build api

# Restart services
docker-compose up -d
```

---

## Updating Configuration

To update configuration after installation:

1. Edit `.env` file:

   ```bash
   nano .env
   ```

2. Restart services:
   ```bash
   docker-compose restart
   ```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

1. Edit `.env` and change `PORT=3000` to another port
2. Restart services: `docker-compose restart`

### Database Connection Issues

Check database logs:

```bash
docker-compose logs db
```

Ensure database is healthy:

```bash
docker-compose ps db
```

### Permission Denied

If you get permission errors, try:

```bash
sudo docker-compose up -d
```

Or add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

### Reset Everything

To completely reset (WARNING: deletes all data):

```bash
docker-compose down -v
rm .env
./install.sh
```

---

## Backup and Restore

### Backup Database

```bash
docker-compose exec db pg_dump -U inkly inkly > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T db psql -U inkly inkly
```

### Backup Volumes

```bash
docker run --rm -v inkly-server_pgdata:/data -v $(pwd):/backup ubuntu tar czf /backup/pgdata-backup.tar.gz /data
```

---

## Uninstallation

To completely remove Inkly:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker rmi $(docker images | grep inkly | awk '{print $3}')

# Remove configuration files
rm .env .inkly-config
```

---

## Production Deployment

For production environments, consider:

1. **Use managed database services** (AWS RDS, DigitalOcean Managed PostgreSQL)
2. **Use managed Redis** (AWS ElastiCache, Redis Cloud)
3. **Set up SSL/TLS** (use nginx or Caddy as reverse proxy)
4. **Configure backups** (automated daily backups)
5. **Set up monitoring** (Prometheus, Grafana)
6. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)
7. **Set proper ALLOWED_ORIGINS** for your domain

### Example Production Setup

```bash
POSTGRES_HOST=your-db.region.rds.amazonaws.com
REDIS_HOST=your-redis.cache.amazonaws.com

ALLOWED_ORIGINS=https://yourdomain.com

POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
```

---

---

## License

`Inkly Backend` is [MIT licensed](https://github.com/OneLiL05/awesome-backend-starter/blob/main/LICENSE)
