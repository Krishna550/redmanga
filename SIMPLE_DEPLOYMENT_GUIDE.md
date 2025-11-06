# 🚀 Red Manga - Simple Free Deployment Guide

Deploy your Red Manga reader app in **5 minutes** using free platforms!

---

## 📋 What You Need

1. **GitHub Account** (to store your code)
2. **Vercel Account** (for frontend - FREE)
3. **Render Account** (for backend - FREE)
4. **MongoDB Atlas Account** (for database - FREE)

All platforms offer generous free tiers perfect for getting started!

---

## Step 1: Setup MongoDB (2 minutes)

### Create Free Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free
3. Click **"Build a Database"** → Choose **"FREE"** (M0 cluster)
4. Select **AWS** as provider, choose closest region
5. Click **"Create"**

### Get Connection String

1. Click **"Connect"** on your cluster
2. Create database user (save username & password!)
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Copy connection string - looks like:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
   ```
5. Replace `<password>` with your actual password

**✅ Done! Save this connection string.**

---

## Step 2: Deploy Backend (2 minutes)

### Option A: Deploy via Render Dashboard (Easiest)

1. Go to [Render](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (or upload files)
4. Configure:
   - **Name**: `red-manga-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend` (if your backend is in a subfolder)

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/
   DB_NAME=red_manga_db
   CORS_ORIGINS=*
   ADMIN_PASSWORD=your-admin-password-here
   ```

6. Click **"Create Web Service"**
7. Wait 2-3 minutes for deployment
8. Copy your backend URL: `https://red-manga-backend.onrender.com`

**✅ Backend deployed!**

---

## Step 3: Deploy Frontend (1 minute)

### Deploy via Vercel

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend` (if your frontend is in a subfolder)
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

5. Add Environment Variable:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://red-manga-backend.onrender.com` (your Render URL)

6. Click **"Deploy"**
7. Wait 1-2 minutes

**✅ Frontend deployed!** You'll get a URL like: `https://red-manga.vercel.app`

---

## Step 4: Final Configuration (30 seconds)

### Update CORS Settings

1. Go back to Render dashboard
2. Click your backend service
3. Go to "Environment" tab
4. Update `CORS_ORIGINS` variable:
   ```
   https://red-manga.vercel.app
   ```
   (or your custom domain if you added one)

5. Click "Save Changes" - Render will auto-redeploy

**✅ All done!**

---

## 🎉 Your App is Live!

Open your Vercel URL: `https://red-manga.vercel.app`

You now have:
- ✅ Live manga reader app
- ✅ Cloud database
- ✅ Auto-deployment (push to GitHub = auto-deploy)
- ✅ Free SSL/HTTPS
- ✅ Global CDN

---

## 📱 Quick Commands Summary

### To Update Your App

```bash
# Make changes to your code
git add .
git commit -m "Update app"
git push origin main

# That's it! Vercel and Render auto-deploy! 🎉
```

---

## 💡 Free Tier Limits

| Platform | Free Tier |
|----------|-----------|
| **MongoDB Atlas** | 512 MB storage (holds ~10,000+ chapters) |
| **Render** | 750 hours/month, 512 MB RAM |
| **Vercel** | 100 GB bandwidth/month, unlimited sites |

These limits are more than enough for starting out!

---

## ⚙️ Optional: Custom Domain

### Add Your Own Domain (Free with Vercel)

1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain (e.g., `redmanga.com`)
3. Update DNS records at your domain registrar (Vercel shows you how)
4. SSL is automatic! ✨

---

## 🐛 Troubleshooting

### Backend Not Loading?
- Check Render logs (Dashboard → Service → Logs)
- Verify MongoDB connection string is correct
- Ensure `MONGO_URL` has no spaces

### Frontend Shows Error?
- Check `REACT_APP_BACKEND_URL` is correct
- Must include `https://` in the URL
- Verify backend is running (visit backend URL in browser)

### CORS Error?
- Update `CORS_ORIGINS` in Render with your Vercel URL
- Save and wait for Render to redeploy (30 seconds)

---

## 📊 Monitoring Your App

### Check Backend Status
Visit: `https://your-backend.onrender.com/api/`

Should return: `{"message":"Red Manga API - Ready"}`

### View Logs
- **Backend**: Render Dashboard → Your Service → Logs
- **Frontend**: Vercel Dashboard → Your Project → Deployments

---

## 🔄 Auto-Deploy Setup

Both Vercel and Render automatically deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# ✨ Auto-deploys in 1-2 minutes!
```

---

## 💰 Cost Breakdown

| Item | Free Tier | Upgrade Cost (if needed) |
|------|-----------|--------------------------|
| **MongoDB** | Free forever | $9/month (M10 cluster) |
| **Render** | Free (sleeps after 15 min inactive) | $7/month (no sleep) |
| **Vercel** | Free forever | $20/month (Pro features) |

**Total to get started: $0/month** 🎉

---

## 🚀 Next Steps

1. **Add Content**: Use the Admin panel to add manga
2. **Share**: Share your Vercel URL with friends
3. **Custom Domain**: Add your own domain (free with Vercel)
4. **Monitor**: Check logs regularly for errors

---

## 📞 Need Help?

- **Render Issues**: [Render Docs](https://render.com/docs)
- **Vercel Issues**: [Vercel Docs](https://vercel.com/docs)
- **MongoDB Issues**: [MongoDB Docs](https://docs.mongodb.com/atlas/)

---

## ✅ Deployment Checklist

- [ ] MongoDB cluster created and connection string saved
- [ ] Backend deployed on Render
- [ ] Backend environment variables set
- [ ] Backend URL copied
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variable set (REACT_APP_BACKEND_URL)
- [ ] CORS updated in Render
- [ ] Visited app URL and confirmed it works
- [ ] Can add manga via admin panel (`/admin`)

---

**Congratulations! Your Red Manga app is now live! 🎉📚**

Share your app with the world and start building your manga library!
