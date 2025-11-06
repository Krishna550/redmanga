# Red Manga - Complete Guide

## Overview
Red Manga is your PWA (Progressive Web App) for reading translated manga. This app has been completely transformed from a scraper to a content management system where you can upload and manage your own translated manga.

## What Changed?

### Backend Transformation
- ❌ **Removed**: Web scraping functionality
- ✅ **Added**: Complete manga management system with MongoDB
- ✅ **Added**: Admin authentication system
- ✅ **Added**: RESTful API for manga and chapters
- ✅ **Added**: Search functionality
- ✅ **Added**: Base64 image storage (perfect for free deployment)

### Frontend Redesign
- 🎨 **New Theme**: Reddish-orange color scheme (#FF4500, #FF6347, #DC143C)
- 🖼️ **New Logo**: Your custom Red Manga logo
- 📱 **New Pages**:
  - **Home**: Welcome page with app description and Telegram link
  - **Manga Lists**: Browse all available manga
  - **Manga Detail**: View manga info and chapters
  - **Reader**: Immersive reading experience
  - **History**: Reading history (stored in browser, no login needed)
  - **Admin**: Upload and manage manga

### Navigation
- ✅ Responsive navbar with hamburger menu
- ✅ Search bar at the top
- ✅ Logo on top left
- ✅ Telegram channel link integrated

## Admin Panel Access

### Default Credentials
- **URL**: `http://your-domain.com/admin` or `http://localhost:3000/admin`
- **Password**: `admin123` (can be changed in `/app/backend/.env`)

### How to Upload Manga

#### Step 1: Create a New Manga
1. Go to `/admin` and login with admin password
2. Click "Create Manga" tab
3. Fill in the form:
   - **Title**: Name of the manga
   - **Description**: Brief synopsis
   - **Author**: Original author name
   - **Genres**: Comma-separated (e.g., "Action, Adventure, Fantasy")
   - **Status**: Ongoing or Completed
   - **Cover Image**: Upload cover (max 5MB)
4. Click "Create Manga"

#### Step 2: Add Chapters
1. In Admin Panel, click "Add Chapter" tab
2. Select the manga from dropdown
3. Enter chapter number (e.g., 1 or 1.5)
4. Enter chapter title
5. Upload chapter pages (max 50 images, 5MB each)
   - **Important**: Images should be in reading order (page1, page2, etc.)
   - Supported formats: JPG, PNG, WebP, GIF
6. Click "Upload Chapter"

### Tips for Best Results
- **Image Size**: Keep images under 5MB each for faster loading
- **Resolution**: 1200-1500px width is ideal for manga pages
- **Naming**: Name files in order (01.jpg, 02.jpg) before uploading for correct order
- **Format**: JPG is recommended for smaller file sizes

## Features

### For Readers
- 📚 **Browse Library**: View all available manga
- 🔍 **Search**: Find manga by title
- 📖 **Reader**: Fullscreen vertical scroll reading
- 📊 **Progress Tracking**: Automatic reading history
- 📱 **PWA**: Install as an app on your device
- 🔗 **Telegram**: Direct link to your channel

### For Admins
- 📤 **Upload Manga**: Add new manga with cover and info
- 📄 **Add Chapters**: Upload chapter pages
- 🗑️ **Delete**: Remove manga or chapters (API available)
- 🔐 **Secure**: Password-protected admin access

## API Endpoints

### Public APIs
```
GET  /api/manga                    - List all manga
GET  /api/manga/{id}               - Get manga details
GET  /api/manga/{id}/chapters      - Get manga chapters
GET  /api/chapter/{id}             - Get chapter with pages
GET  /api/search?q={query}         - Search manga
GET  /api/featured?limit={n}       - Get featured manga
```

### Admin APIs (Require Authorization Header)
```
POST   /api/admin/auth             - Authenticate
POST   /api/admin/manga            - Create manga
POST   /api/admin/chapter          - Add chapter
DELETE /api/admin/manga/{id}       - Delete manga
DELETE /api/admin/chapter/{id}     - Delete chapter
```

## Configuration

### Environment Variables

**Backend** (`/app/backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017/
DB_NAME=red_manga_db
CORS_ORIGINS=*
ADMIN_PASSWORD=admin123
```

**Frontend** (`/app/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Changing Admin Password
1. Edit `/app/backend/.env`
2. Change `ADMIN_PASSWORD=your_new_password`
3. Restart backend: `sudo supervisorctl restart backend`

## Deployment

### Free Deployment Options
This app is optimized for free deployment with:
- Base64 image storage (no separate storage service needed)
- MongoDB Atlas free tier (512MB)
- Vercel/Netlify for frontend
- Render/Railway for backend

### Production Checklist
- [ ] Change admin password
- [ ] Update `REACT_APP_BACKEND_URL` to production URL
- [ ] Set up MongoDB Atlas or production database
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up domain for Telegram link

## Telegram Integration
- Your channel: https://t.me/red_manga
- Link appears on homepage and in navbar
- Use it to notify readers about new chapters

## Technical Stack
- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Storage**: Base64 (embedded in database)
- **PWA**: Service Worker enabled

## Browser Storage
- Reading history stored in localStorage
- No login required for readers
- Persists across sessions
- Can be cleared from History page

## Troubleshooting

### Images not showing
- Check image size (max 5MB)
- Verify base64 encoding is valid
- Check browser console for errors

### Admin panel not accessible
- Verify backend is running: `curl http://localhost:8001/api/`
- Check admin password in .env file
- Clear browser cache

### Chapters out of order
- Rename files before uploading (01.jpg, 02.jpg, etc.)
- Browser may select files in random order

### Search not working
- Ensure manga titles are properly saved
- Check MongoDB connection
- Restart backend service

## Support
For issues or questions:
1. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Check frontend logs: `tail -f /var/log/supervisor/frontend.err.log`
3. Restart services: `sudo supervisorctl restart all`

## Color Palette
- Primary Red: #FF4500
- Secondary Red: #FF6347
- Dark Red: #DC143C
- Light Red: #FFA07A
- Background: #0a0a0a
- Card Background: #1a1a1a

---

**Enjoy your Red Manga PWA! 🔴📚**
