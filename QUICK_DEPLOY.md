# Quick Deployment Reference

## Fastest Way to Deploy

### 1. Environment Setup (5 minutes)

**Backend `.env`:**
```bash
echo "MONGO_URL=mongodb://localhost:27017
DB_NAME=manga_reader
CORS_ORIGINS=*" > /app/backend/.env
```

**Frontend `.env`:**
```bash
echo "REACT_APP_BACKEND_URL=" > /app/frontend/.env
```

### 2. Install & Build (10 minutes)

```bash
# Backend
cd /app/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install
yarn build
```

### 3. Deploy (5 minutes)

**Option A: Docker Compose (Easiest)**
```bash
cd /app
docker-compose up -d
```

**Option B: Manual**
```bash
# Start backend
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4 &

# Serve frontend with Nginx
sudo cp -r /app/frontend/build/* /var/www/manga-reader/
sudo systemctl restart nginx
```

### 4. Test
```bash
# Test backend
curl http://localhost:8001/api/

# Open frontend
# Visit: http://your-server-ip
```

---

## Environment Variables Quick Reference

| Variable | Location | Value (Dev) | Value (Prod) |
|----------|----------|-------------|--------------|
| `MONGO_URL` | backend/.env | `mongodb://localhost:27017` | Your MongoDB URL |
| `DB_NAME` | backend/.env | `manga_reader` | `manga_reader` |
| `CORS_ORIGINS` | backend/.env | `*` | `https://yourdomain.com` |
| `REACT_APP_BACKEND_URL` | frontend/.env | *(empty)* | `https://api.yourdomain.com` or *(empty)* |

---

## Nginx Config Template

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/manga-reader;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Common Deployment Commands

```bash
# Check backend status
systemctl status manga-backend

# Check frontend (Nginx) status  
systemctl status nginx

# View backend logs
journalctl -u manga-backend -f

# View Nginx logs
tail -f /var/log/nginx/error.log

# Restart services
systemctl restart manga-backend
systemctl restart nginx

# Test API
curl -X POST http://localhost:8001/api/extract-chapter \
  -H "Content-Type: application/json" \
  -d '{"chapter_url": "https://hivetoons.org/series/lookism/chapter-579"}'
```

---

## Port Checklist

- ✅ Backend: 8001
- ✅ Frontend: 80 (HTTP) / 443 (HTTPS)
- ✅ MongoDB: 27017 (internal only)

---

## Cloud Platform Quick Deploys

### Vercel (Frontend)
```bash
cd /app/frontend
vercel --prod
```

### Railway (Backend)
```bash
cd /app/backend
railway up
```

### Render (Full Stack)
1. Connect GitHub repo
2. Add web service for backend (port 8001)
3. Add static site for frontend (build command: `yarn build`, publish directory: `build`)

---

## Docker Compose (All-in-One)

```bash
cd /app
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## SSL Setup (30 seconds)

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend not starting | Check `MONGO_URL` in `.env` |
| CORS errors | Update `CORS_ORIGINS` in backend `.env` |
| 404 on /api/* | Check Nginx proxy config |
| Frontend shows blank | Rebuild: `yarn build` |
| MongoDB connection failed | Start MongoDB: `systemctl start mongod` |

---

## Health Check URLs

- Backend: `http://your-domain/api/`
- Frontend: `http://your-domain/`

---

## Production Checklist

- [ ] MongoDB running
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured  
- [ ] Backend running on 8001
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] SSL enabled
- [ ] Test chapter extraction
- [ ] Test download feature

**That's it! Your manga reader should be live! 🚀**
