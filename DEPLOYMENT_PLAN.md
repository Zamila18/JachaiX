# JachaiX: Complete Deployment & Hosting Plan ($5-10/month)

**Version:** 1.0  
**Date:** 2026-06-09  
**Target Budget:** $5–10/month  
**Status:** Production-Ready

---

## Executive Summary

JachaiX is a complex multi-service AI platform with:
- **1 Frontend** (Next.js 14)
- **1 Backend API** (Laravel 13)
- **6 ML Microservices** (OCR, Embedder, Reranker, Image Forensics, Reranker-EN, MCP Servers)
- **2 Databases** (MySQL 8, Redis 7)
- **1 Vector DB** (Qdrant)

**Recommended Approach:** **Hybrid containerized deployment** on budget cloud platforms using Docker, strategic service consolidation, and intelligent caching.

---

## Part 1: Hosting Provider Recommendation

### Tier 1: Primary Hosting (Cost: $6-8/month)

#### **Option A: Railway.app** ⭐ **RECOMMENDED**
- **Cost:** $0–8/month (pay-as-you-go, generous free tier)
- **Why:** 
  - Native Docker support (no rebuilding required)
  - Integrated PostgreSQL/MySQL starter databases
  - Perfect for multi-container apps
  - Environment variables & secrets management built-in
  - 100GB egress/month free
- **Services to Host:**
  - Frontend (Next.js)
  - Backend API (Laravel + Queue Worker)
  - Databases (MySQL, Redis)
  - Qdrant Vector DB
  - Python ML Services (OCR, Embedder, Reranker, Image Forensics)

**Estimated Railway Cost Breakdown:**
- Next.js Frontend: $2/month
- Laravel Backend + Worker: $2.50/month
- MySQL: $2/month
- Redis: $1/month
- Qdrant + ML Services (shared): $0.50/month
- **Total: ~$8/month**

#### **Option B: Fly.io**
- **Cost:** $3–12/month for starter setup
- **Why:** Great for multi-container deployments, built-in monitoring
- **Trade-off:** Slightly steeper learning curve, but slightly cheaper for this workload

#### **Option C: Render.com**
- **Cost:** $7/month minimum (free tiers end faster than Railway)
- **Why:** Simpler UI than Railway, good for beginners

---

## Part 2: Architecture Design for $5-10/month

### Recommended Setup: Unified Railway Deployment

```
┌─────────────────────────────────────────────────────┐
│                    Railway.app                       │
│                   (Single Project)                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Frontend (Next.js 14)                        │   │
│  │  - Port: 3000                                │   │
│  │  - Memory: 512MB                             │   │
│  │  - Size: XS (pay-per-use)                    │   │
│  └──────────────────────────────────────────────┘   │
│                      ↓                               │
│  ┌──────────────────────────────────────────────┐   │
│  │  Backend (Laravel 13 + Queue Worker)          │   │
│  │  - Port: 8000 (API)                          │   │
│  │  - Memory: 1GB                               │   │
│  │  - 1 Main + 1 Queue Worker process           │   │
│  └──────────────────────────────────────────────┘   │
│         ↓                    ↓                       │
│  ┌─────────────┐      ┌──────────────┐              │
│  │   MySQL 8   │      │   Redis 7    │              │
│  │  (Railway   │      │  (Railway    │              │
│  │   Managed)  │      │   Managed)   │              │
│  └─────────────┘      └──────────────┘              │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Qdrant Vector DB                             │   │
│  │  - Port: 6333                                │   │
│  │  - Memory: 512MB                             │   │
│  │  - Docker image: qdrant/qdrant               │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Python ML Services (Shared Container)        │   │
│  │  - OCR Service (port 5001)                   │   │
│  │  - Embedder Service (port 5002)              │   │
│  │  - Reranker Service (port 5003)              │   │
│  │  - Memory: 2GB                               │   │
│  │  - Multi-process with Gunicorn               │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Image Forensics Service (Optional)           │   │
│  │  - Port: 5007                                │   │
│  │  - Deploy only if needed, else skip          │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Part 3: Deployment Plan (Step-by-Step)

### Phase 1: Pre-Deployment Preparation (Local)

#### 1.1 Create Railway Configuration Files

Create `.railway/docker-compose.yml` at the root:

```yaml
# This tells Railway how to build and run your services
services:
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://jachaix-api.railway.app
    depends_on:
      - app

  app:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - REDIS_HOST=redis
      - QDRANT_URL=http://qdrant:6333
    depends_on:
      - mysql
      - redis
      - qdrant

  worker:
    build:
      context: ./backend
    command: php artisan queue:work --tries=3 --timeout=900
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=jachaix
      - MYSQL_USER=jachaix
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  ocr-service:
    build:
      context: ./services/ocr-service
    ports:
      - "5001:5001"
    volumes:
      - easyocr_models:/root/.EasyOCR

  embedder-service:
    build:
      context: ./services/embedder-service
    ports:
      - "5002:5002"
    environment:
      - QDRANT_HOST=qdrant
      - JINA_API_KEY=${JINA_API_KEY}

  reranker-service:
    build:
      context: ./services/reranker-service
    ports:
      - "5003:5003"

volumes:
  mysql_data:
  redis_data:
  qdrant_data:
  easyocr_models:
```

#### 1.2 Update Dockerfiles

**Backend (Dockerfile)**:
```dockerfile
FROM php:8.3-fpm

WORKDIR /var/www/html

# Install dependencies
RUN apt-get update && apt-get install -y \
    git curl libpq-dev \
    && docker-php-ext-install pdo_mysql pdo

COPY . .
RUN composer install --no-dev
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
```

**Frontend (Dockerfile)**:
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY package.json next.config.mjs ./

EXPOSE 3000
CMD ["npm", "start"]
```

#### 1.3 Environment Variables File

Create `railway.env`:
```env
# Database
MYSQL_ROOT_PASSWORD=secure_root_password_here
MYSQL_PASSWORD=secure_user_password_here
MYSQL_DATABASE=jachaix

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=knowledge_base

# Laravel
APP_KEY=your_base64_app_key_here
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
QUEUE_CONNECTION=redis

# LLM (Use ollama or OpenAI)
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=llama3.2

# ML Services
JINA_API_KEY=your_jina_key_here
JINA_MODEL=jina-embeddings-v3
JINA_DIMS=1024

# Frontend
NEXT_PUBLIC_API_URL=https://jachaix-api.railway.app
```

---

### Phase 2: Deploy to Railway

#### 2.1 Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → "Deploy from GitHub"

#### 2.2 Connect GitHub Repository

1. Authorize Railway to access your GitHub
2. Select `Zamila18/JachaiX` repository
3. Railway will auto-detect the Docker Compose setup

#### 2.3 Deploy

```bash
# In your project root, commit your changes
git add .
git commit -m "Add railway deployment configuration"
git push origin main

# Railway will automatically detect and deploy via GitHub webhook
```

#### 2.4 Set Environment Variables in Railway Dashboard

1. Go to Railway dashboard → Your Project
2. Click each service and add variables from `railway.env`
3. Pay special attention to:
   - `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD`
   - `APP_KEY` (generate via `php artisan key:generate`)
   - `OPENAI_API_KEY` (if using OpenAI, else use local ollama)

---

### Phase 3: Post-Deployment Setup

#### 3.1 Run Laravel Migrations

Once deployed, run:
```bash
# Via Railway CLI
railway run php artisan migrate --force

# Or via Railway dashboard terminal
```

#### 3.2 Seed Knowledge Base

```bash
railway run php artisan db:seed  # if you have seeders
# OR manually load corpus via crawlers/embedders
```

#### 3.3 Verify Services

```bash
# Check health of each service
curl https://jachaix-api.railway.app/health
curl https://jachaix-frontend.railway.app
```

---

## Part 4: Cost Optimization Strategies

### A. Memory & CPU Optimization

| Service | Recommended Size | Why |
|---------|-----------------|-----|
| Frontend (Next.js) | XS (512MB) | Static generation + lightweight |
| Backend (Laravel) | S (1GB) | Moderate memory for queue workers |
| Worker Process | S (1GB) | Async job processing |
| MySQL | S (1GB) | Standard for fact-check claims |
| Redis | XS (512MB) | Caching + queue only |
| Qdrant | XS–S (512MB–1GB) | Vector indexing |
| ML Services (shared) | M (2GB) | OCR + Embeddings require more RAM |

**Estimated Monthly Cost: $6–8**

### B. Database Optimization

**Choose: Railway Managed Databases** (cheaper than standalone instances)
- MySQL: $2/month (managed)
- Redis: $1/month (managed)
- Alternative: Planetscale (MySQL) + Upstash (Redis) if Railway pricing changes

### C. ML Service Optimization

**Option 1: Use External APIs** (Recommended for v1)
- Replace local Embedder with **Jina API** ($0.30 per 1M tokens)
- Replace Reranker with **Cohere Rerank API** (~free tier available)
- **Saves:** 2GB RAM (embedder + reranker containers)
- **Cost:** ~$5-10/month for typical usage

**Option 2: Keep Local ML Services** (If API costs exceed compute costs)
- Consolidate OCR + Embedder + Reranker into single multi-process container
- Use lightweight models (TinyBERT, MiniLM for reranking)
- **Cost:** +$2-3/month but potentially better latency

**Recommended for $5-10 budget: Option 1** (Use external APIs)

---

## Part 5: Alternative Budget Deployment (Sub-$5/month)

If you need to go even cheaper:

### A. Serverless Approach: AWS Lambda + API Gateway

```
Cost Breakdown:
- Lambda (Laravel via Bref): $1-2/month
- API Gateway: $3.50 (1M requests free tier)
- RDS MySQL: $10-15/month (TOO EXPENSIVE)
→ Use Planetscale serverless MySQL: $29/month (exceeds budget)
```

**Verdict:** Serverless doesn't save money for this workload due to database costs.

### B. Self-Hosted VPS (Linode/DigitalOcean)

```
- Linode Nanode (1GB RAM): $5/month
- Problem: All services run on 1GB—will crash under load
- Not recommended for production
```

### C. Hybrid: Railway for Services + Free Tier Databases

```
- Railway (without databases): $3-5/month
- MongoDB Atlas (free tier 512MB): $0
- Redis Cloud (free tier 30MB): $0
- Problem: Free tiers are too small for production
```

**Verdict:** Railway Managed is the sweet spot for this budget.

---

## Part 6: Monitoring & Maintenance

### A. Health Checks & Uptime Monitoring

**Free Options:**
- **UptimeRobot** (monitors health endpoints, free)
- **Railway built-in monitoring** (included)

**Setup:**
```bash
# Add health check endpoint in Laravel (routes/api.php)
Route::get('/health', fn() => response()->json(['status' => 'ok']));

# Monitor via UptimeRobot
# https://jachaix-api.railway.app/health
```

### B. Logging & Error Tracking

**Free Options:**
- **Railway logs** (built-in, 7-day history)
- **Sentry** (free tier: 5K errors/month)

**Setup Sentry:**
```bash
composer require sentry/sentry-laravel
php artisan sentry:publish

# In .env
SENTRY_LARAVEL_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

### C. Performance Monitoring

**Free Options:**
- **Railway metrics** (CPU, memory, bandwidth—built-in)
- **New Relic free tier** (minimal but enough)

---

## Part 7: Scaling Strategy (If Usage Grows)

### When to Scale Beyond $10/month

| Metric | Action | Cost Impact |
|--------|--------|-------------|
| >1000 claims/day | Add second worker process | +$1–2/month |
| >10GB Qdrant vectors | Increase Qdrant memory | +$1–2/month |
| >100GB data transfer | Add CDN (Cloudflare) | $0 (free tier) or +$20/month |
| >50% CPU average | Upgrade to Medium tier | +$3–5/month |

---

## Part 8: Checklist for Deployment

### Pre-Deployment
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Prepare `.railway/docker-compose.yml`
- [ ] Update all Dockerfiles
- [ ] Generate `APP_KEY` for Laravel
- [ ] Create `railway.env` with all secrets

### Deployment
- [ ] Push code to GitHub
- [ ] Wait for automatic Railway deployment (~5-10 min)
- [ ] Verify all services are running (Railway dashboard)
- [ ] Check logs for errors

### Post-Deployment
- [ ] Run database migrations
- [ ] Load initial corpus data
- [ ] Test API endpoints
- [ ] Test frontend accessibility
- [ ] Configure monitoring (UptimeRobot, Sentry)
- [ ] Enable auto-scaling policies

### Ongoing Maintenance (Monthly)
- [ ] Review Railway usage & costs
- [ ] Check error logs (Sentry)
- [ ] Monitor database size
- [ ] Refresh knowledge base (if using local crawlers)

---

## Part 9: Estimated Monthly Cost Breakdown

### Final Railway Setup

| Component | Size | Cost |
|-----------|------|------|
| Frontend (Next.js) | XS | $2.00 |
| Backend (Laravel) | S | $2.50 |
| Worker Process | Shared (S) | Included |
| MySQL (Managed) | - | $2.00 |
| Redis (Managed) | - | $1.00 |
| Qdrant | XS | $0.50 |
| **Subtotal** | | **$8.00** |
| Network Egress (100GB free, $0.10 per GB after) | - | $0.00 |
| **Total Monthly** | | **$8.00** |

**With External ML APIs** (Jina Embeddings + Cohere Rerank):
- Reduce ML services size from 2GB to shared
- Save: ~$1.50/month on compute
- Add: ~$5-10/month on API usage (depending on volume)
- **Net: $12-16/month** (exceeds budget for high volume)

**Recommendation:** Use local ML services if within Railway resources, else use free/cheap API tiers during MVP phase.

---

## Part 10: Quick Start (5 Minutes)

### TL;DR Deployment

```bash
# 1. Create railway.yml in project root
cat > railway.yml << 'EOF'
$schema: https://railway.app/schema.json
build:
  builder: dockerfile
  context: .
deploy:
  startCommand: docker compose up
EOF

# 2. Login to Railway CLI
npm install -g @railway/cli
railway login

# 3. Create project & deploy
railway init
railway up

# 4. Set environment variables
railway variables set $(cat railway.env)

# 5. Check deployment
railway logs
```

---

## Conclusion

**Best Option: Railway.app with Local ML Services**
- **Cost:** $8/month
- **Effort:** Medium (requires Docker understanding)
- **Reliability:** 99.9% uptime SLA
- **Scalability:** Easy to add resources as needed

**Alternative: Railway + External APIs**
- **Cost:** $13-18/month (if >1000 claims/day)
- **Effort:** Low (no ML service management)
- **Reliability:** Dependent on API providers
- **Best for:** Low-latency, fully managed

---

## Support Resources

- **Railway Docs:** https://docs.railway.app
- **Docker Compose Reference:** https://docs.docker.com/compose
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

**Next Steps:** Follow Phase 1 → Phase 3 above and deploy today! 🚀
