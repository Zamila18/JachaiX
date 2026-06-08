# 🚀 JachaiX Production Deployment - Step-by-Step Checklist

**Status:** Ready to Deploy  
**Timeline:** 20 minutes  
**Target:** Railway.app @ $8/month  

---

## PRE-DEPLOYMENT CHECKLIST (Do These First)

### ☐ Step 1: Generate App Key (2 minutes)

```bash
cd backend
php artisan key:generate --show
```

**Output Example:**
```
base64:abcdefghijk1234567890=
```

**✅ Save this value** - you'll need it in Step 4

---

### ☐ Step 2: Create railway.env File (3 minutes)

In your project root (`e:\jachaix\`), create a file named `railway.env`:

```bash
# Windows PowerShell
@"
# ==== DATABASE ====
MYSQL_ROOT_PASSWORD=JachaiX_Root_2026_Secure123!
MYSQL_PASSWORD=JachaiX_User_2026_Secure456!
MYSQL_DATABASE=jachaix
MYSQL_USER=jachaix

# ==== REDIS ====
REDIS_HOST=redis
REDIS_PORT=6379

# ==== QDRANT ====
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=knowledge_base

# ==== LARAVEL (Update APP_KEY from Step 1)
APP_NAME=JachaiX
APP_ENV=production
APP_DEBUG=false
APP_URL=https://jachaix-api.railway.app
APP_KEY=base64:YOUR_KEY_FROM_STEP_1_HERE

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=jachaix
DB_USERNAME=jachaix
DB_PASSWORD=JachaiX_User_2026_Secure456!

QUEUE_CONNECTION=redis
REDIS_HOST=redis
REDIS_PASSWORD=null

# ==== SERVICES ====
OCR_SERVICE_URL=http://ocr-service:5001
EMBEDDER_SERVICE_URL=http://embedder-service:5002
RERANKER_SERVICE_URL=http://reranker-service:5003

# ==== EXTERNAL APIs (Optional) ====
JINA_API_KEY=your_jina_key_here
OPENAI_API_KEY=sk-xxxx

# ==== FRONTEND ====
NEXT_PUBLIC_API_URL=https://jachaix-api.railway.app
NODE_ENV=production
"@ | Set-Content -Path railway.env
```

**OR Mac/Linux:**
```bash
cat > railway.env << 'EOF'
MYSQL_ROOT_PASSWORD=JachaiX_Root_2026_Secure123!
# ... rest of file
EOF
```

**✅ Verify:** Check that `railway.env` exists in `e:\jachaix\`

---

### ☐ Step 3: Create Railway Configuration Files (5 minutes)

#### 3.1 Create `railway.toml`

```bash
# PowerShell
@"
[build]
builder = "docker"

[deploy]
startCommand = "docker compose up"
restartPolicyMaxRetries = 3
"@ | Set-Content -Path railway.toml
```

**✅ Location:** `e:\jachaix\railway.toml`

#### 3.2 Create `.dockerignore`

```bash
@"
node_modules
.git
.env
.env.local
.env.example
coverage
dist
build
.next
vendor
storage/logs
storage/cache
.DS_Store
Thumbs.db
"@ | Set-Content -Path .dockerignore
```

**✅ Location:** `e:\jachaix\.dockerignore`

#### 3.3 Create Frontend Dockerfile

```bash
@"
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
"@ | Set-Content -Path frontend\Dockerfile
```

**✅ Location:** `e:\jachaix\frontend\Dockerfile`

#### 3.4 Update Backend Dockerfile

**Check if exists:** `e:\jachaix\backend\Dockerfile`

If missing, create it:

```bash
@"
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
    oniguruma-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install pdo pdo_mysql gd zip

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy dependencies
COPY composer.* ./
RUN composer install --no-dev --no-interaction

# Copy app
COPY . .

# Fix permissions
RUN mkdir -p storage/logs storage/cache && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
"@ | Set-Content -Path backend\Dockerfile
```

**✅ Location:** `e:\jachaix\backend\Dockerfile`

---

### ☐ Step 4: Add Health Check Endpoint (2 minutes)

Edit `backend/routes/api.php`, add:

```php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'database' => DB::connection()->getPdo() ? 'connected' : 'failed'
    ]);
});
```

**✅ Verify:** This endpoint doesn't require authentication

---

### ☐ Step 5: Git Commit (2 minutes)

```bash
cd e:\jachaix
git add .
git commit -m "Add Railway deployment configuration

- Add railway.toml configuration
- Add Dockerfiles for frontend and backend
- Add railway.env template
- Add health check endpoint
- Ready for Railway deployment"
git push origin main
```

**✅ Verify:** Changes are on GitHub

---

## DEPLOYMENT CHECKLIST (On Railway.app)

### ☐ Step 6: Create Railway Account (3 minutes)

1. Go to **https://railway.app**
2. Click **"Start Now"** (top right)
3. Click **"Deploy with GitHub"**
4. Click **"Authorize"** (allow Railway to access your GitHub)
5. Complete login

**✅ You're logged into Railway**

---

### ☐ Step 7: Create New Project (2 minutes)

1. In Railway dashboard, click **"New Project"**
2. Click **"Deploy from GitHub"**
3. Search for **"JachaiX"** or **"Zamila18/JachaiX"**
4. Click on the repository
5. Click **"Deploy"**

**⏳ Railway will now:**
- Detect `docker-compose.yml`
- Start building all containers
- This takes ~10-15 minutes (first time, due to ML models)

**✅ Check build progress in "Build" tab**

---

### ☐ Step 8: Set Environment Variables (5 minutes)

While Docker builds, set up environment variables:

1. Click **"Variables"** tab
2. You'll see this form:

```
Key              | Value
─────────────────┼────────────────
NODE_ENV         | production
MYSQL_ROOT_...   | [paste from railway.env]
...
```

3. Copy-paste the contents of `railway.env` line by line:
   - Click **"+ Add Variable"**
   - Copy first line from `railway.env`: `MYSQL_ROOT_PASSWORD=JachaiX_Root_2026_Secure123!`
   - Paste into Key/Value fields
   - Repeat for all variables in `railway.env`

**OR use Railway CLI (faster):**

```bash
npm install -g @railway/cli
railway login
railway link  # Select your project
railway variables set $(Get-Content railway.env | ForEach-Object {$_ -replace '^', ''})
```

**✅ All variables are now in Railway**

---

### ☐ Step 9: Wait for Build (10 minutes)

While builds complete, go grab coffee ☕

**Monitor progress:**
1. Click **"Build"** tab
2. You'll see logs like:
   ```
   Starting build of php service...
   Building docker image...
   Pushing to registry...
   ✓ Build successful
   ```

**Expected build time:**
- Frontend: 3-4 minutes
- Backend: 3-5 minutes
- MySQL/Redis: 1-2 minutes
- ML Services: 3-5 minutes (downloading models)

**✅ When all services show green ✓**

---

### ☐ Step 10: Configure Databases (2 minutes)

1. In Railway dashboard, click **"MySQL"** service
2. Copy connection string (you'll see it in service details)
3. Click **"Deployments"** tab
4. Wait for MySQL to finish initializing (green status)

**✅ Database is ready**

---

## POST-DEPLOYMENT CHECKLIST (Final Setup)

### ☐ Step 11: Run Database Migrations (3 minutes)

**Option A: Via Railway CLI (Recommended)**

```bash
railway link
railway run php artisan migrate --force
```

**Option B: Via Railway Dashboard**

1. Click **"app"** service
2. Click **"Deployments"** 
3. Click the running deployment
4. Scroll to **"Command Palette"** or **"Terminal"**
5. Type: `php artisan migrate --force`
6. Press Enter

**Output should show:**
```
Migrating: 2014_10_12_000000_create_users_table
Migrated: 2014_10_12_000000_create_users_table
...
Migration complete!
```

**✅ Database schema is created**

---

### ☐ Step 12: Test API Endpoint (2 minutes)

Open browser and navigate to:

```
https://jachaix-api.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-09T12:34:56.000000Z",
  "database": "connected"
}
```

**If you see this ✅ — Backend is running!**

**If 502 error ❌:**
- Go back to step 11, migrations may have failed
- Check logs: `railway logs --service app`

---

### ☐ Step 13: Test Frontend (1 minute)

Open browser and navigate to:

```
https://jachaix-frontend.railway.app
```

**Expected:** JachaiX homepage loads ✅

**If blank page ❌:**
- Check build logs
- Ensure `NEXT_PUBLIC_API_URL` is set correctly

---

### ☐ Step 14: Set Up Monitoring (5 minutes)

Go to **https://uptimerobot.com**

1. Click **"Add Monitor"**
2. Select **"HTTP(s)"**
3. Enter: `https://jachaix-api.railway.app/health`
4. Set check interval: **5 minutes**
5. Click **"Create"**

**✅ You'll get alerts if service goes down**

---

### ☐ Step 15: Monitor Costs (1 minute)

1. Go to Railway dashboard
2. Click **"Account"** (bottom left)
3. Click **"Usage & Billing"**
4. Set spending limit to: **$10**

**✅ You won't be charged more than $10/month**

---

## VERIFICATION CHECKLIST

Before marking complete, verify all of these:

- [ ] GitHub repo has `railway.toml`
- [ ] Railway dashboard shows all services: ✓ green
- [ ] `https://jachaix-api.railway.app/health` returns JSON ✅
- [ ] `https://jachaix-frontend.railway.app` loads ✅
- [ ] Database migrations completed ✅
- [ ] Environment variables all set ✅
- [ ] UptimeRobot monitoring active ✅
- [ ] Monthly bill shows ~$8 (check after 24 hours) ✅

---

## TROUBLESHOOTING

### ❌ App keeps crashing
```bash
railway logs --service app
# Look for errors, common ones:
# - Database connection refused → Wait 2 min for MySQL
# - Missing env var → Add to Variables tab
# - Out of memory → Upgrade plan or reduce services
```

### ❌ Database migrations failed
```bash
railway run php artisan migrate:reset  # Clear and retry
railway run php artisan migrate --force
```

### ❌ Queue workers not running
```bash
railway logs --service worker
# Should show: "Processing jobs..."
# If not: Check REDIS_HOST and QUEUE_CONNECTION env vars
```

### ❌ Frontend shows API errors
Check that `NEXT_PUBLIC_API_URL` matches your actual API URL:
```bash
# It should be: https://jachaix-api.railway.app
# NOT: http://localhost:8000
```

### ❌ Out of storage
```bash
# Check which service is using space:
railway logs --service mysql
railway logs --service qdrant

# Possible fixes:
# - Clear old logs: php artisan tinker → Log::truncate()
# - Reduce vector DB retention
# - Upgrade plan
```

---

## NEXT STEPS (After Deployment)

1. **Seed knowledge base**
   ```bash
   railway run php scripts/refresh_knowledge_base.sh
   ```

2. **Test a claim**
   ```bash
   curl -X POST https://jachaix-api.railway.app/api/claims \
     -H "Content-Type: application/json" \
     -d '{"claim": "Test claim", "language": "en"}'
   ```

3. **Monitor for 1 week**
   - Check error logs daily
   - Verify costs stay under $10
   - Get feedback from test users

4. **Scale if needed**
   - Add more workers: Click "app" → increase replicas
   - Upgrade container size if CPU/memory high
   - Move to Fly.io if costs exceed $12/month

---

## QUICK REFERENCE COMMANDS

```bash
# SSH into running container
railway run bash

# View logs
railway logs --service app
railway logs --service worker
railway logs --service mysql

# Run artisan commands
railway run php artisan tinker
railway run php artisan queue:work --once

# Database access
railway run php artisan db  # Interactive MySQL shell

# Check deployment status
railway status

# Stop/restart service
railway logs --follow  # Real-time logs

# See all available commands
railway help
```

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Docker Compose:** https://docs.docker.com/compose
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **Next.js:** https://nextjs.org/docs/deployment

---

**🎉 You're live! Congratulations! 🎉**

**Total time invested:** ~20 minutes  
**Total monthly cost:** $8/month  
**Uptime:** 99.9%+  

---

**Questions?** Check the logs or ask the team! 🚀
