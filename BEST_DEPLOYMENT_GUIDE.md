# Manga Reader - Best Deployment Guide

This is the **recommended production deployment** using modern cloud platforms. Fast, reliable, and free tier available.

---

## 🎯 Deployment Stack (Recommended)

- **Frontend**: Vercel (Free, automatic SSL, CDN)
- **Backend**: Railway (Free $5 credit, easy deployment)
- **Database**: MongoDB Atlas (Free 512MB cluster)

**Total Setup Time**: ~30 minutes  
**Cost**: Free tier covers small-medium traffic

---

## Step 1: Database Setup (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Create a new project (name it "manga-reader")

### 1.2 Create Database Cluster

1. Click "Build a Database"
2. Choose **FREE** M0 cluster
3. Select cloud provider (AWS recommended)
4. Choose region closest to your users
5. Cluster name: `manga-cluster`
6. Click "Create"

### 1.3 Configure Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
   - Username: `manga_admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
3. Click "Add User"

### 1.4 Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String

1. Go to "Database" → Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Python, Version: 3.11 or later
4. Copy connection string:
   ```
   mongodb+srv://manga_admin:<password>@manga-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>` with your actual password**
6. **Save this connection string** - you'll need it for backend

---

## Step 2: Backend Deployment (Railway)

### 2.1 Prepare Backend

1. Make sure `/app/backend/requirements.txt` exists and contains:
```txt
fastapi==0.110.1
uvicorn==0.25.0
motor==3.3.1
python-dotenv==1.2.1
httpx==0.28.1
beautifulsoup4==4.14.2
lxml==6.0.2
starlette==0.37.2
pydantic==2.12.3
```

2. Create `/app/backend/Procfile`:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### 2.2 Deploy to Railway

**Option A: GitHub Integration (Recommended)**

1. Push your code to GitHub:
```bash
cd /app
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [Railway](https://railway.app)
3. Sign up with GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your manga-reader repository
6. Railway will auto-detect it's a Python app

**Option B: Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
cd /app/backend
railway init
railway up
```

### 2.3 Configure Environment Variables in Railway

1. In Railway dashboard, click your project
2. Go to "Variables" tab
3. Add these variables:

```env
MONGO_URL=mongodb+srv://manga_admin:YOUR_PASSWORD@manga-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=manga_reader
CORS_ORIGINS=*
PORT=8001
```

**Important**: Replace `YOUR_PASSWORD` and cluster URL with your actual MongoDB connection string from Step 1.5

### 2.4 Get Backend URL

1. In Railway dashboard, go to "Settings" tab
2. Click "Generate Domain"
3. Your backend URL will be: `https://your-app-name.up.railway.app`
4. **Save this URL** - you'll need it for frontend

### 2.5 Test Backend

```bash
curl https://your-app-name.up.railway.app/api/
```

Expected response: `{"message":"Hello World"}`

---

## Step 3: Frontend Deployment (Vercel)

### 3.1 Configure Frontend Environment

Create `/app/frontend/.env.production`:

```env
REACT_APP_BACKEND_URL=https://your-app-name.up.railway.app
```

**Replace with your actual Railway backend URL from Step 2.4**

### 3.2 Update CORS in Backend

Go back to Railway → Variables and update:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
```

(You can update this after you get your Vercel URL)

### 3.3 Deploy to Vercel

**Option A: Vercel Dashboard (Easiest)**

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your manga-reader repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
   - **Install Command**: `yarn install`

6. Add Environment Variable:
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-app-name.up.railway.app`

7. Click "Deploy"

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /app/frontend
vercel --prod
```

When prompted:
- Set up and deploy?: **Y**
- Which scope?: Choose your account
- Link to existing project?: **N**
- Project name: `manga-reader`
- Directory: `./`
- Override settings?: **Y**
  - Build Command: `yarn build`
  - Output Directory: `build`
  - Development Command: `yarn start`

### 3.4 Get Frontend URL

Your app will be deployed to:
```
https://manga-reader-xxxxx.vercel.app
```

Or connect your custom domain in Vercel settings.

---

## Step 4: Final Configuration

### 4.1 Update CORS in Railway

1. Go to Railway dashboard
2. Update `CORS_ORIGINS` variable:
```
https://manga-reader-xxxxx.vercel.app
```

Or for custom domain:
```
https://yourdomain.com,https://www.yourdomain.com
```

### 4.2 Test Complete Flow

1. Open your Vercel URL: `https://manga-reader-xxxxx.vercel.app`
2. Enter test URL: `https://hivetoons.org/series/lookism/chapter-579`
3. Click "Start Reading"
4. Verify:
   - ✅ Pages load
   - ✅ Long strip view works
   - ✅ Smooth scrolling
   - ✅ Download button works
   - ✅ Fullscreen toggle works

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Domain to Vercel

1. Go to Vercel project settings
2. Click "Domains"
3. Add your domain: `yourdomain.com`
4. Vercel provides DNS records to add to your domain registrar

### 5.2 SSL Certificate

- **Automatic!** Vercel handles SSL certificates automatically
- Your site will be available at `https://yourdomain.com`

### 5.3 Update CORS

Update Railway environment variable:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🔧 Environment Variables Summary

### Backend (Railway)
```env
MONGO_URL=mongodb+srv://manga_admin:PASSWORD@manga-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=manga_reader
CORS_ORIGINS=https://manga-reader-xxxxx.vercel.app
PORT=8001
```

### Frontend (Vercel)
```env
REACT_APP_BACKEND_URL=https://your-app-name.up.railway.app
```

---

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Backend deployed to Railway
- [ ] Backend environment variables set
- [ ] Backend URL obtained and tested
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set (REACT_APP_BACKEND_URL)
- [ ] CORS updated with frontend URL
- [ ] Full flow tested (chapter extraction works)
- [ ] Download feature tested
- [ ] Custom domain added (optional)

---

## 📊 Monitoring & Logs

### Backend Logs (Railway)
1. Go to Railway dashboard
2. Click your project
3. Click "Deployments" tab
4. View real-time logs

### Frontend Logs (Vercel)
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. View build and function logs

### MongoDB Monitoring
1. Go to MongoDB Atlas
2. Click "Metrics" tab
3. Monitor connections, operations, and storage

---

## 🔄 Updating Your App

### Update Backend
```bash
# Make changes, commit, and push
cd /app/backend
git add .
git commit -m "Update backend"
git push origin main
```
Railway auto-deploys on push!

### Update Frontend
```bash
# Make changes, commit, and push
cd /app/frontend
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel auto-deploys on push!

---

## 🐛 Troubleshooting

### Issue: CORS Error
**Solution**: Update `CORS_ORIGINS` in Railway to include your Vercel URL

### Issue: Backend Not Responding
**Solution**: 
1. Check Railway logs for errors
2. Verify `MONGO_URL` is correct
3. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Issue: MongoDB Connection Failed
**Solution**:
1. Check MongoDB Atlas cluster is running
2. Verify connection string in Railway variables
3. Make sure password doesn't contain special characters (or URL encode them)

### Issue: Frontend Shows Blank Page
**Solution**:
1. Check Vercel build logs
2. Verify `REACT_APP_BACKEND_URL` is set correctly
3. Rebuild deployment in Vercel

### Issue: 404 on /api/* Routes
**Solution**: Backend might be down. Check Railway logs and ensure backend is deployed correctly.

---

## 💰 Costs & Limits

### Free Tier Limits:

**MongoDB Atlas** (Free M0):
- 512 MB storage
- Shared CPU
- 100 connections max
- **Good for**: 10,000+ manga chapters

**Railway** (Free):
- $5 credit monthly
- ~500 hours uptime
- 512 MB RAM
- 1 GB disk
- **Good for**: Small to medium traffic

**Vercel** (Free):
- 100 GB bandwidth/month
- Unlimited sites
- Automatic SSL
- Global CDN
- **Good for**: Most use cases

### When to Upgrade:
- **High traffic**: Upgrade Vercel (Pro: $20/mo)
- **Large database**: Upgrade MongoDB Atlas (M10: $9/mo)
- **24/7 backend**: Upgrade Railway (Hobby: $5/mo)

---

## 🎯 Performance Tips

### 1. Enable Caching
Add to Railway environment variables:
```env
CACHE_TTL=3600
```

### 2. Optimize Images
Manga images are already optimized by source sites

### 3. Database Indexes
Connect to MongoDB and create indexes:
```javascript
db.status_checks.createIndex({ "timestamp": -1 })
```

### 4. Monitor Performance
- Use Vercel Analytics (free)
- Use Railway Metrics
- Monitor MongoDB Atlas metrics

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Specify exact domains in production
3. **MongoDB**: Use strong passwords
4. **Rate Limiting**: Add rate limiting to backend (optional)
5. **HTTPS**: Automatic with Vercel (always use HTTPS)

---

## 📈 Scaling Guide

### When you need to scale:

**1000+ daily users**:
- Keep current setup
- Monitor Railway usage
- Consider upgrading MongoDB to M10

**10,000+ daily users**:
- Upgrade Railway to Hobby plan
- Upgrade MongoDB to M20
- Consider CDN for static assets

**100,000+ daily users**:
- Move backend to dedicated server (DigitalOcean, AWS)
- Use Redis for caching
- MongoDB M30+ with replicas
- Load balancer

---

## ✅ Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors  
✅ Can enter manga chapter URL  
✅ Backend extracts pages correctly  
✅ Long strip view displays all pages  
✅ Download button creates ZIP file  
✅ Fullscreen mode works  
✅ No CORS errors in console  
✅ No 404 errors  
✅ SSL certificate valid (HTTPS)  

---

## 🎉 You're Done!

Your manga reader is now live in production with:
- ✅ Professional hosting (Vercel + Railway)
- ✅ Cloud database (MongoDB Atlas)
- ✅ Automatic deployments (push to deploy)
- ✅ SSL/HTTPS enabled
- ✅ Global CDN
- ✅ Free tier that handles most traffic

**Your app is production-ready! 🚀**

---

## 📞 Support

If you encounter issues:
1. Check troubleshooting section
2. Review Railway logs
3. Review Vercel logs
4. Check MongoDB Atlas metrics
5. Ensure all environment variables are set correctly

**Common URLs to keep handy:**
- Railway Dashboard: https://railway.app
- Vercel Dashboard: https://vercel.com
- MongoDB Atlas: https://cloud.mongodb.com
- Your Frontend: https://manga-reader-xxxxx.vercel.app
- Your Backend: https://your-app-name.up.railway.app
