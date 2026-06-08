# Railway Deployment Quick Reference

**Project:** JachaiX  
**Budget:** $8/month (estimated)  
**Platform:** Railway.app  
**Time to Deploy:** ~15-20 minutes

---

## 1️⃣ Preparation (5 minutes)

### 1.1 Generate Laravel App Key
```bash
cd backend
php artisan key:generate --show
# Copy the output (it starts with "base64:...")
```

### 1.2 Create railway.env File
Save this as `railway.env` in your project root:

```env
# ==== DATABASE ====
MYSQL_ROOT_PASSWORD=JachaiX_Root_2026_SecurePass
MYSQL_PASSWORD=JachaiX_User_2026_SecurePass
MYSQL_DATABASE=jachaix
MYSQL_USER=jachaix

# ==== REDIS ====
REDIS_HOST=redis
REDIS_PORT=6379

# ==== QDRANT ====
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=knowledge_base

# ==== LARAVEL ====
APP_NAME=JachaiX
APP_ENV=production
APP_DEBUG=false
APP_URL=https://jachaix-api.railway.app
APP_KEY=base64:YOUR_KEY_HERE  # Replace with output from 1.1

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=jachaix
DB_USERNAME=jachaix
DB_PASSWORD=JachaiX_User_2026_SecurePass

QUEUE_CONNECTION=redis
REDIS_HOST=redis
REDIS_PASSWORD=null

# ==== SERVICES ====
OCR_SERVICE_URL=http://ocr-service:5001
EMBEDDER_SERVICE_URL=http://embedder-service:5002
RERANKER_SERVICE_URL=http://reranker-service:5003

# ==== EXTERNAL APIs (Optional) ====
JINA_API_KEY=your_jina_api_key_here  # Get from https://jina.ai
OPENAI_API_KEY=sk-xxxx  # If using OpenAI, else use local ollama

# ==== NEXT.js FRONTEND ====
NEXT_PUBLIC_API_URL=https://jachaix-api.railway.app
NODE_ENV=production
```

### 1.3 Update backend/.env.example
```bash
# Add any missing variables from railway.env to backend/.env.example
# So new developers know what to set
```

---

## 2️⃣ Create Railway Docker Configuration (5 minutes)

### 2.1 Create `railway.toml` (Railway Native Configuration)

Save as `railway.toml` in project root:

```toml
[build]
builder = "docker"

[build.dockerfile]
path = "Dockerfile"

[deploy]
startCommand = "docker compose up"
restartPolicyMaxRetries = 3
healthcheckPath = "/health"
healthcheckTimeout = 10
```

### 2.2 Create `.dockerignore` (project root)

```
node_modules
.git
.env
.env.local
coverage
dist
build
.next
vendor
storage/logs
storage/cache
```

### 2.3 Verify Dockerfiles Exist

**Frontend Dockerfile** - Create `frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

**Backend Dockerfile** - Create/Verify `backend/Dockerfile`:
```dockerfile
FROM php:8.3-fpm-alpine

WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    git \
    curl \
    oniguruma-dev \
    postgresql-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql gd zip

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy and install dependencies
COPY backend/composer.* ./
RUN composer install --no-dev --no-interaction

# Copy application
COPY backend/ .

# Create necessary directories
RUN mkdir -p storage/logs storage/cache && \
    chmod -R 775 storage bootstrap/cache

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

**Python ML Services** - Verify `services/*/Dockerfile` exist

---

## 3️⃣ Update docker-compose.yml

Create `.railway/docker-compose.yml` (Railway will use this):

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./backend
    container_name: jachaix-app
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - REDIS_HOST=redis
      - QDRANT_HOST=qdrant
    depends_on:
      - mysql
      - redis
      - qdrant
    networks:
      - jachaix
    restart: unless-stopped

  worker:
    build:
      context: ./backend
    container_name: jachaix-worker
    command: php artisan queue:work --tries=3 --timeout=900
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    networks:
      - jachaix
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
    container_name: jachaix-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://jachaix-api.railway.app
    depends_on:
      - app
    networks:
      - jachaix
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    container_name: jachaix-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - jachaix
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: jachaix-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - jachaix
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    container_name: jachaix-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - jachaix
    restart: unless-stopped

  ocr-service:
    build:
      context: ./services/ocr-service
    container_name: jachaix-ocr
    ports:
      - "5001:5001"
    volumes:
      - easyocr_models:/root/.EasyOCR
    networks:
      - jachaix
    restart: unless-stopped

  embedder-service:
    build:
      context: ./services/embedder-service
    container_name: jachaix-embedder
    ports:
      - "5002:5002"
    environment:
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333
      - JINA_API_KEY=${JINA_API_KEY:-}
    networks:
      - jachaix
    restart: unless-stopped

  reranker-service:
    build:
      context: ./services/reranker-service
    container_name: jachaix-reranker
    ports:
      - "5003:5003"
    environment:
      - HF_HOME=/root/.cache/huggingface
    volumes:
      - hf_models:/root/.cache/huggingface
    networks:
      - jachaix
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  qdrant_data:
  easyocr_models:
  hf_models:

networks:
  jachaix:
    driver: bridge
```

---

## 4️⃣ Deploy to Railway (5 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Start Now"
3. Sign up with GitHub (fastest)

### Step 2: Create Project
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub"
3. Authorize Railway to access your GitHub

### Step 3: Select Repository
1. Search for `JachaiX`
2. Click on `Zamila18/JachaiX`
3. Click "Deploy"

### Step 4: Wait for Build
- Railway will automatically detect `docker-compose.yml`
- Build will take ~10-15 minutes (first time is slower due to ML models)
- Check progress in the "Build" tab

### Step 5: Configure Environment Variables
Once build is complete:

1. In Railway dashboard, click your project
2. Go to "Variables" tab
3. Paste the contents of `railway.env` (from section 1.2)
4. Click "Deploy" to apply changes

### Step 6: Generate Database
1. Click "MySQL" service
2. Click "Query" button
3. Wait for database to initialize
4. Run initial migrations:
   ```sql
   -- This will be done via Laravel artisan, not here
   ```

---

## 5️⃣ Post-Deployment Setup (5 minutes)

### 5.1 SSH into App Container (via Railway CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Select your project
railway link

# Run migrations
railway run php artisan migrate --force

# (Optional) Seed database
railway run php artisan db:seed
```

### 5.2 Verify Services

```bash
# Check API is running
curl https://jachaix-api.railway.app/health

# Check Frontend is running
curl https://jachaix-frontend.railway.app
```

### 5.3 Monitor Logs

```bash
railway logs --service app
railway logs --service worker
railway logs --service mysql
```

---

## 6️⃣ Common Issues & Fixes

### ❌ "Connection refused" on MySQL
**Cause:** MySQL still initializing  
**Fix:** Wait 2-3 minutes, then retry migrations

### ❌ "JINA_API_KEY not found"
**Cause:** Environment variable not set  
**Fix:** Go to Railway Variables → add `JINA_API_KEY=your_key`

### ❌ "Out of memory" on ML services
**Cause:** Limited Railway resources  
**Fix:** 
- Use external APIs (Jina for embeddings, Cohere for reranking)
- Or upgrade to larger Railway plan

### ❌ Queue workers not processing jobs
**Cause:** Redis connection failed  
**Fix:** 
```bash
railway run redis-cli ping  # Should return "PONG"
```

### ❌ Frontend shows API errors
**Cause:** `NEXT_PUBLIC_API_URL` not set correctly  
**Fix:** Ensure it matches your actual API domain in Railway

---

## 7️⃣ Monitoring & Health Checks

### Set Up UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Click "Add Monitor"
3. Select "HTTP(s)"
4. Enter: `https://jachaix-api.railway.app/health`
5. Set check interval to 5 minutes
6. Get alerts if service goes down

### View Railway Metrics
1. Go to Railway dashboard
2. Click your service (e.g., "app")
3. View CPU, Memory, Bandwidth usage
4. Set alerts if needed

---

## 8️⃣ Cost Check

After 24 hours of deployment:

1. Go to Railway dashboard
2. Click "Account"
3. Click "Usage & Billing"
4. See breakdown of costs by service

**Expected:** $6-8/month

---

## 9️⃣ Next Steps

- [ ] Prepare `railway.env` with your secrets
- [ ] Create Dockerfiles
- [ ] Create `.railway/docker-compose.yml`
- [ ] Commit and push to GitHub
- [ ] Create Railway account
- [ ] Deploy via GitHub integration
- [ ] Run migrations
- [ ] Test API endpoints
- [ ] Set up monitoring
- [ ] Monitor costs for first 24 hours

---

## 🚀 Deploy Command (All-in-One)

```bash
# 1. Prepare files
cp railway.env.example railway.env
# Edit railway.env with your values

# 2. Commit
git add railroad.toml .railway/ railway.env.example Dockerfile* backend/Dockerfile frontend/Dockerfile
git commit -m "Add Railway deployment configuration"
git push origin main

# 3. Deploy in Railway dashboard
# (It will auto-detect from GitHub push)

# 4. Run setup
railway link
railway run php artisan migrate --force
railway logs
```

---

**Estimated Time to Live:** 15-20 minutes from start to production ✅
