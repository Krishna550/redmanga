# Manga Reader PWA - Documentation

## 🌟 Overview

Manga Reader is a Progressive Web App (PWA) designed for seamless manga reading experience on mobile and desktop devices. Built with React, featuring fullscreen support, offline capabilities, and smooth navigation.

## ✨ Key Features

### Core Functionality
- **Chapter URL Extraction**: Automatically extract all manga pages from a chapter URL
- **Fullscreen Reading**: Immersive manga viewing experience
- **Multi-Page Support**: Load and navigate through multiple manga pages
- **Smart Navigation**: Keyboard shortcuts, swipe gestures, and tap zones
- **Offline Support**: Service Worker caching for offline reading
- **PWA Installable**: Add to home screen on mobile devices
- **Dual Input Methods**: Chapter URL (auto-extract) or direct image URLs

### User Interface
- **Dark Glassmorphism Theme**: Modern dark UI with glassmorphic effects
- **Purple-Teal Gradient**: Beautiful gradient accent colors
- **Auto-hiding Controls**: Controls fade away for distraction-free reading
- **Thumbnail Strip**: Quick page navigation with thumbnail preview
- **Progress Indicator**: Visual progress bar and page counter

### Navigation Methods

1. **Keyboard Navigation**:
   - `←` (Left Arrow): Previous page
   - `→` (Right Arrow): Next page
   - `F`: Toggle fullscreen
   - `Esc`: Exit fullscreen

2. **Touch/Swipe**:
   - Swipe left: Next page
   - Swipe right: Previous page
   - Tap left side: Previous page
   - Tap right side: Next page
   - Tap center: Toggle controls

3. **Button Controls**:
   - Chevron buttons: Navigate pages
   - Grid button: Open thumbnail strip
   - Fullscreen button: Toggle fullscreen
   - Exit button: Return to input screen

## 🚀 Installation & Usage

### As a Web App

**Method 1: Chapter URL (Recommended)**
1. Visit the app URL in your browser
2. Enter a manga chapter URL (e.g., `https://mangawebsite.com/manga-name/chapter-1`)
3. Click "Extract & Start Reading"
4. The app will automatically extract all manga page images from that chapter

**Method 2: Direct Image URLs**
1. Switch to "Image URLs" tab
2. Enter direct manga page image URLs (one per line or comma-separated)
3. Click "Start Reading"

**Note**: Some manga websites may block automated extraction due to CORS or anti-scraping measures. If extraction fails, you can manually enter the image URLs using Method 2.

### Install as PWA
1. **On Mobile (Android/iOS)**:
   - Open in browser (Chrome/Safari)
   - Tap "Add to Home Screen" or "Install App"
   - Icon will appear on your home screen

2. **On Desktop**:
   - Open in Chrome/Edge
   - Click install icon in address bar
   - App will install like a native app

## 📁 Project Structure

```
frontend/
├── public/
│   ├── manifest.json        # PWA manifest configuration
│   ├── sw.js               # Service Worker for offline support
│   ├── icon-192.png        # PWA icon (192x192)
│   └── icon-512.png        # PWA icon (512x512)
│
├── src/
│   ├── App.js              # Main app component
│   ├── index.css           # Design system & glassmorphism styles
│   └── components/
│       ├── URLInputScreen.jsx    # Input screen for loading manga
│       ├── ReaderView.jsx        # Main reader component
│       └── ThumbnailStrip.jsx    # Thumbnail navigation component
```

## 🎨 Design System

### Color Palette (HSL)
```css
--background: 0 0% 7%          /* Near-black background */
--primary: 270 75% 60%          /* Vibrant purple */
--secondary: 174 72% 56%        /* Teal accent */
--foreground: 0 0% 95%          /* Light text */
```

### Glassmorphism Effects
- Backdrop blur: 12-16px
- Semi-transparent backgrounds: rgba(18, 18, 18, 0.7)
- Subtle borders: rgba(255, 255, 255, 0.1)
- Smooth transitions: 0.3s cubic-bezier

## 🔧 Technical Details

### Service Worker Caching Strategy

**Static Cache** (STATIC_CACHE):
- Core app files (HTML, CSS, JS)
- Cached on install

**Image Cache** (IMAGE_CACHE):
- Manga page images
- Cache-first strategy
- Aggressive caching for offline reading

### PWA Manifest Configuration
```json
{
  "name": "Manga Reader",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

### Performance Optimizations
- **Preloading**: Next and previous pages preloaded
- **Lazy Loading**: Images loaded on demand
- **Smooth Transitions**: Hardware-accelerated CSS transitions
- **Touch Optimization**: Touch-action and user-select controls

## 🌐 Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ Opera

## 📱 Mobile Optimization

- Viewport optimized for mobile (user-scalable=no)
- Touch-friendly button sizes (48px+)
- Swipe gestures for natural navigation
- Fullscreen mode on launch
- Status bar styling (black-translucent)

## 🐛 Troubleshooting

### Images Not Loading
- Ensure URLs are direct image links (jpg, png, webp)
- Check for CORS issues with image host
- Try demo URLs to verify app functionality

### Service Worker Not Registering
- Ensure HTTPS or localhost
- Check browser console for errors
- Clear cache and reload

### Fullscreen Not Working
- Some browsers restrict fullscreen to user gesture
- Try 'F' key instead of button
- Check browser permissions

## 🔮 Future Enhancements

- [ ] Image zoom and pan
- [ ] Reading history
- [ ] Bookmarks
- [ ] Multiple reading modes (vertical scroll)
- [ ] Image filters (brightness, contrast)
- [ ] Cloud sync
- [ ] Manga library management

## 📄 License

This project is built as a prototype on Emergent.sh platform.

## 🙏 Credits

- Design inspiration: Tachiyomi, Webtoon
- UI Framework: React + Tailwind CSS
- Components: Shadcn/ui
- Icons: Lucide React
- Fonts: Space Grotesk (Google Fonts)

---

**Made with ❤️ using Emergent.sh**
