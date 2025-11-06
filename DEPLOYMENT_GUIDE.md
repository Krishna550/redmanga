# Manga Reader - Deployment Guide

This guide will help you deploy the Manga Reader application to production, maintaining the same functionality as the development environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Deployment Options](#deployment-options)
8. [Testing After Deployment](#testing-after-deployment)

---

## Prerequisites

- **Node.js** 16+ and **Yarn** package manager
- **Python** 3.11+
- **MongoDB** database (local or cloud like MongoDB Atlas)
- **Web server** (Nginx, Apache) or cloud platform
- **Domain name** (optional but recommended)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd manga-reader
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
yarn install
```

---

## Database Setup

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>
   ```

### Option B: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Linux
   sudo systemctl start mongod
   
   # macOS
   brew services start mongodb-community
   
   # Windows
   net start MongoDB
   ```
3. Your connection string: `mongodb://localhost:27017`

---

## Environment Variables

### Backend Environment Variables

Create `/app/backend/.env`:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGO_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>

DB_NAME=manga_reader

# CORS Origins (comma-separated)
CORS_ORIGINS=*
# For production, specify your frontend domain:
# CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment Variables

Create `/app/frontend/.env`:

**For Development:**
```env
REACT_APP_BACKEND_URL=
```
*(Empty string uses relative URLs with proxy)*

**For Production:**
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```
*OR if backend and frontend are on same domain:*
```env
REACT_APP_BACKEND_URL=
```

---

## Backend Deployment

### Method 1: Traditional Server (VPS)

#### 1. Install Dependencies
```bash
cd /app/backend
pip install -r requirements.txt
```

#### 2. Run with Production Server

**Using Gunicorn:**
```bash
pip install gunicorn
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

**Using Uvicorn:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

#### 3. Setup as System Service

Create `/etc/systemd/system/manga-backend.service`:

```ini
[Unit]
Description=Manga Reader Backend
After=network.target

[Service]
Type=notify
User=your-username
WorkingDirectory=/app/backend
Environment="PATH=/app/backend/venv/bin"
ExecStart=/app/backend/venv/bin/gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable manga-backend
sudo systemctl start manga-backend
```

### Method 2: Docker Deployment

Create `/app/backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

Build and run:
```bash
docker build -t manga-backend .
docker run -d -p 8001:8001 --env-file .env manga-backend
```

### Method 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
heroku create manga-reader-backend
git push heroku main
```

#### Railway / Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

---

## Frontend Deployment

### 1. Build Production Files

```bash
cd /app/frontend
yarn build
```

This creates an optimized production build in `/app/frontend/build/`

### 2. Deployment Options

#### Option A: Static Hosting (Netlify, Vercel)

**Netlify:**
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Deploy: `netlify deploy --prod --dir=build`

**Vercel:**
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`

#### Option B: Traditional Server (Nginx)

1. Copy build files to web server:
```bash
sudo cp -r build/* /var/www/manga-reader/
```

2. Configure Nginx (`/etc/nginx/sites-available/manga-reader`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/manga-reader;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

3. Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/manga-reader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option C: Same Server (Backend + Frontend)

If deploying both on same server, update nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve frontend
    root /var/www/manga-reader;
    index index.html;

    # API routes go to backend
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # All other routes serve frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSL/HTTPS Setup (Recommended)

### Using Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure SSL and update your Nginx config.

---

## Docker Compose (Full Stack)

Create `/app/docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: manga-mongodb
    restart: always
    environment:
      MONGO_INITDB_DATABASE: manga_reader
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: manga-backend
    restart: always
    environment:
      MONGO_URL: mongodb://mongodb:27017
      DB_NAME: manga_reader
      CORS_ORIGINS: "*"
    ports:
      - "8001:8001"
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: manga-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Frontend Dockerfile (`/app/frontend/Dockerfile`):

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Frontend Nginx config (`/app/frontend/nginx.conf`):

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Deploy with:
```bash
docker-compose up -d
```

---

## Testing After Deployment

### 1. Test Backend API

```bash
curl -X POST https://yourdomain.com/api/extract-chapter \
  -H "Content-Type: application/json" \
  -d '{"chapter_url": "https://hivetoons.org/series/lookism/chapter-579"}'
```

Expected: JSON response with `image_urls` array

### 2. Test Frontend

1. Open `https://yourdomain.com` in browser
2. Enter a manga chapter URL
3. Click "Start Reading"
4. Verify:
   - Pages load in long strip view
   - Smooth scrolling works
   - Download button works
   - Fullscreen toggle works
   - No console errors

### 3. Check Logs

**Backend:**
```bash
# Systemd service
sudo journalctl -u manga-backend -f

# Docker
docker logs manga-backend -f
```

**Frontend (Nginx):**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Issue: CORS Errors

**Solution:** Update backend `.env`:
```env
CORS_ORIGINS=https://yourdomain.com
```

### Issue: 404 on /api/* routes

**Solution:** Ensure Nginx proxy configuration is correct and backend is running on port 8001

### Issue: MongoDB Connection Failed

**Solution:** 
- Check MongoDB is running: `sudo systemctl status mongod`
- Verify MONGO_URL in backend `.env`
- For MongoDB Atlas, check IP whitelist

### Issue: Frontend shows old version

**Solution:**
```bash
cd /app/frontend
yarn build
# Copy new build files to server
```

---

## Production Checklist

- [ ] MongoDB database created and accessible
- [ ] Backend `.env` configured with production values
- [ ] Frontend `.env` configured with production backend URL
- [ ] Backend running on port 8001
- [ ] Frontend build files deployed
- [ ] Nginx configured to proxy /api/* to backend
- [ ] SSL certificate installed (HTTPS)
- [ ] CORS configured correctly
- [ ] Tested: Chapter extraction works
- [ ] Tested: Long strip view displays correctly
- [ ] Tested: Download chapter feature works
- [ ] Tested: Fullscreen mode works
- [ ] Tested: Thumbnail navigation works
- [ ] Monitoring/logging set up

---

## Performance Optimization

### Backend
- Use Gunicorn with multiple workers
- Enable gzip compression
- Add Redis for caching (optional)

### Frontend
- Serve from CDN
- Enable gzip/brotli compression in Nginx
- Set proper cache headers for static assets

### Database
- Create indexes for frequently queried fields
- Use MongoDB connection pooling

---

## Monitoring

### Backend Health Check
Add to backend `server.py`:
```python
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "manga-reader-backend"}
```

### Uptime Monitoring
Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

---

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --uri="$MONGO_URL" --out=/backups/manga-$(date +%Y%m%d)

# Restore
mongorestore --uri="$MONGO_URL" /backups/manga-20240101
```

### Automated Backups
Set up cron job:
```bash
0 2 * * * mongodump --uri="$MONGO_URL" --out=/backups/manga-$(date +\%Y\%m\%d)
```

---

## Support & Maintenance

- Regularly update dependencies
- Monitor error logs
- Keep MongoDB updated
- Renew SSL certificates (Certbot auto-renews)
- Monitor disk space
- Check application performance

---

## Summary

Your manga reader is now deployed! The application should work exactly like it does in development:

✅ Enter chapter URL → Extract pages → Read in long strip view
✅ Download chapters as ZIP
✅ Fullscreen with tap toggle
✅ Smooth scrolling
✅ No tap zones or popups

For questions or issues, check the logs first, then refer to the Troubleshooting section.
