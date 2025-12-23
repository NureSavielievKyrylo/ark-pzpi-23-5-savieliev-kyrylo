#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}║        🚀 Inkly Installation 🚀        ║${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            echo "$ID"
        else
            echo "unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

install_docker_linux() {
    local distro=$1
    echo -e "${YELLOW}🔧 Installing Docker on Linux ($distro)...${NC}"

    case $distro in
        ubuntu|debian)
            sudo apt-get update

            sudo apt-get install -y ca-certificates curl gnupg lsb-release

            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$distro/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg

            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$distro \
              $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

            sudo systemctl start docker
            sudo systemctl enable docker

            sudo usermod -aG docker $USER
            echo -e "${GREEN}✅ Docker installed successfully${NC}"
            echo -e "${YELLOW}⚠️  You may need to log out and back in for group changes to take effect${NC}"
            ;;

        centos|rhel|fedora)
            sudo yum install -y yum-utils

            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

            sudo systemctl start docker
            sudo systemctl enable docker

            sudo usermod -aG docker $USER
            echo -e "${GREEN}✅ Docker installed successfully${NC}"
            echo -e "${YELLOW}⚠️  You may need to log out and back in for group changes to take effect${NC}"
            ;;

        *)
            echo -e "${RED}❌ Unsupported Linux distribution: $distro${NC}"
            echo -e "${BLUE}Please install Docker manually: https://docs.docker.com/get-docker/${NC}"
            exit 1
            ;;
    esac
}

install_docker_macos() {
    echo -e "${YELLOW}🔧 Installing Docker on macOS...${NC}"

    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}📦 Homebrew not found. Installing Homebrew first...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    echo -e "${YELLOW}📦 Installing Docker Desktop via Homebrew...${NC}"
    brew install --cask docker

    echo -e "${GREEN}✅ Docker Desktop installed${NC}"
    echo -e "${YELLOW}⚠️  Please start Docker Desktop from Applications and wait for it to fully start${NC}"
    echo -e "${YELLOW}⚠️  Press Enter once Docker Desktop is running...${NC}"
    read
}

echo -e "${YELLOW}📋 Checking dependencies...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    read -p "$(echo -e ${YELLOW}Do you want to install Docker automatically? [Y/n]:${NC} )" INSTALL_DOCKER
    INSTALL_DOCKER=${INSTALL_DOCKER:-Y}

    if [[ $INSTALL_DOCKER =~ ^[Yy]$ ]]; then
        OS=$(detect_os)
        echo -e "${BLUE}Detected OS: $OS${NC}"

        case $OS in
            macos)
                install_docker_macos
                ;;
            ubuntu|debian|centos|rhel|fedora)
                install_docker_linux $OS
                ;;
            *)
                echo -e "${RED}❌ Unsupported operating system${NC}"
                echo -e "${BLUE}Visit: https://docs.docker.com/get-docker/${NC}"
                exit 1
                ;;
        esac

        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker installation failed or Docker is not in PATH${NC}"
            echo -e "${YELLOW}Please ensure Docker is running and try again${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Docker is required to continue${NC}"
        echo -e "${BLUE}Visit: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose is not available${NC}"
    echo -e "${BLUE}Note: Modern Docker installations include Docker Compose as a plugin${NC}"

    OS=$(detect_os)
    if [[ "$OS" != "macos" && "$OS" != "unknown" ]]; then
        echo -e "${YELLOW}Attempting to install Docker Compose plugin...${NC}"
        case $OS in
            ubuntu|debian)
                sudo apt-get install -y docker-compose-plugin
                ;;
            centos|rhel|fedora)
                sudo yum install -y docker-compose-plugin
                ;;
        esac
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is still not available${NC}"
        echo -e "${BLUE}Visit: https://docs.docker.com/compose/install/${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ All dependencies are installed${NC}"
echo ""

generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

read_with_default() {
    local prompt="$1"
    local default="$2"
    local value

    if [ -n "$default" ]; then
        read -p "$(echo -e ${YELLOW}${prompt}${NC} [${default}]: ) " value
        echo "${value:-$default}"
    else
        read -p "$(echo -e ${YELLOW}${prompt}${NC}: )" value
        echo "$value"
    fi
}

read_password() {
    local prompt="$1"
    local default="$2"
    local value

    if [ -n "$default" ]; then
        read -sp "$(echo -e ${YELLOW}${prompt}${NC} [auto-generated]: ) " value
        echo "" >&2
        echo "${value:-$default}"
    else
        read -sp "$(echo -e ${YELLOW}${prompt}${NC}: )" value
        echo "" >&2
        echo "$value"
    fi
}

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Configuration Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}📝 Basic Configuration:${NC}"
PORT=$(read_with_default "Port for API" "8080")
ALLOWED_ORIGINS=$(read_with_default "Allowed origins (comma-separated)" "http://localhost:3000")
echo ""

echo -e "${GREEN}🗄️  PostgreSQL Configuration:${NC}"
echo -e "${YELLOW}Press Enter to use default values for local development${NC}"
POSTGRES_USER=$(read_with_default "PostgreSQL username" "inkly")
POSTGRES_DB=$(read_with_default "PostgreSQL database name" "inkly")
POSTGRES_PASSWORD=$(read_password "PostgreSQL password" "$(generate_password)")
echo ""

echo -e "${GREEN}📦 Redis Configuration:${NC}"
echo -e "${YELLOW}Press Enter to use default values${NC}"
REDIS_USER=$(read_with_default "Redis username" "default")
REDIS_PASSWORD=$(read_password "Redis password" "$(generate_password)")
echo ""

echo -e "${GREEN}☁️  AWS S3 Configuration:${NC}"
echo -e "${YELLOW}Enter your AWS credentials or leave empty to configure later${NC}"
AWS_REGION=$(read_with_default "AWS Region" "us-east-1")
AWS_S3_BUCKET=$(read_with_default "S3 Bucket name" "")
AWS_ACCESS_KEY_ID=$(read_with_default "AWS Access Key ID" "")
AWS_SECRET_ACCESS_KEY=$(read_password "AWS Secret Access Key" "")
echo ""

echo -e "${GREEN}🔐 Generating security secrets...${NC}"
COOKIE_SECRET=$(generate_password)
BETTER_AUTH_SECRET=$(generate_password)
echo -e "${GREEN}✅ Security secrets generated${NC}"
echo ""

echo -e "${YELLOW}💾 Creating .env file...${NC}"

cat > .env << EOF
# Generated by Inkly installer at $(date)

# Application
NODE_ENV=production
PORT=${PORT}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# PostgreSQL
POSTGRES_HOST=db
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_USER=${REDIS_USER}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# AWS S3
AWS_REGION=${AWS_REGION}
AWS_S3_BUCKET=${AWS_S3_BUCKET}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# Security
COOKIE_SECRET=${COOKIE_SECRET}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo ""

if [ -z "$AWS_S3_BUCKET" ] || [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${YELLOW}⚠️  Warning: AWS S3 credentials are not configured${NC}"
    echo -e "${YELLOW}   You can edit .env file later to add them${NC}"
    echo ""
fi

echo -e "${YELLOW}💾 Creating docker-compose.yml...${NC}"

cat > docker-compose.yml << 'EOF'
networks:
  dev:
    driver: bridge

services:
  db:
    container_name: inkly-db
    image: 'postgres:18'
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - dev
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  redis:
    container_name: inkly-redis
    image: 'redis:8'
    restart: always
    command:
      - 'redis-server'
      - '--requirepass'
      - '${REDIS_PASSWORD}'
      - '--user'
      - '${REDIS_USER}'
      - 'on'
      - '>${REDIS_PASSWORD}'
      - '~*'
      - '+@all'
    ulimits:
      memlock: -1
    volumes:
      - redisdata:/data
    networks:
      - dev
    environment:
      - REDIS_USER=${REDIS_USER}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  api:
    container_name: inkly-api
    image: onelil/inkly-server:latest
    restart: always
    ports:
      - '${PORT}:8080'
    environment:
      - NODE_ENV=production
      - PORT=${PORT}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - POSTGRES_HOST=db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_PORT=5432
      - COOKIE_SECRET=${COOKIE_SECRET}
      - REDIS_HOST=redis
      - REDIS_USER=default
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - REDIS_PORT=6379
      - AWS_REGION=${AWS_REGION}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dev
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

volumes:
  pgdata:
  redisdata:
EOF

echo -e "${GREEN}✅ docker-compose.yml created${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Docker Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Do you want to start Inkly now? [Y/n]:${NC} )" START_NOW
START_NOW=${START_NOW:-Y}

if [[ $START_NOW =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
    docker compose pull

    echo ""
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker compose up -d

    echo ""
    echo -e "${GREEN}✅ Inkly is now running!${NC}"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Installation Complete!${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}📍 API is available at:${NC} http://localhost:${PORT}"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  ${BLUE}docker compose logs -f${NC}        - View logs"
    echo -e "  ${BLUE}docker compose ps${NC}             - Check services status"
    echo -e "  ${BLUE}docker compose stop${NC}           - Stop services"
    echo -e "  ${BLUE}docker compose down${NC}           - Stop and remove containers"
    echo -e "  ${BLUE}docker compose restart${NC}        - Restart services"
    echo ""
else
    echo ""
    echo -e "${GREEN}✅ Configuration saved to .env${NC}"
    echo -e "${YELLOW}To start Inkly later, run:${NC}"
    echo -e "  ${BLUE}docker compose up -d${NC}"
    echo ""
fi

echo -e "${YELLOW}💾 Saving configuration summary...${NC}"
cat > .inkly-config << EOF
Port: ${PORT}
PostgreSQL User: ${POSTGRES_USER}
PostgreSQL Database: ${POSTGRES_DB}
Redis User: ${REDIS_USER}
AWS Region: ${AWS_REGION}
AWS S3 Bucket: ${AWS_S3_BUCKET}
EOF

echo -e "${GREEN}✅ Configuration summary saved to .inkly-config${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}Thank you for installing Inkly! 🎉${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
