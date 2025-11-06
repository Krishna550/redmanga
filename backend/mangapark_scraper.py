"""
Manga Scraper for mangapark.net
Extracts manga information, chapters, and downloads images
"""

import requests
from bs4 import BeautifulSoup
import re
import os
from pathlib import Path
from typing import Dict, List, Optional
import time
import logging
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MangaScraper:
    """Scraper for mangapark.net"""
    
    BASE_URL = "https://mangapark.net"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    def __init__(self, download_dir: str = "downloads"):
        """
        Initialize the scraper
        
        Args:
            download_dir: Directory to save downloaded images
        """
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
    
    def get_manga_info(self, title_url: str) -> Dict:
        """
        Extract manga information from title page
        
        Args:
            title_url: URL to manga title page
            
        Returns:
            Dictionary with manga info (id, name, url)
        """
        try:
            logger.info(f"Fetching manga info from: {title_url}")
            response = self.session.get(title_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Extract manga ID and name from URL
            # Format: /title/224523-en-solo-necromancer
            url_pattern = r'/title/(\d+)-en-([^/]+)'
            match = re.search(url_pattern, title_url)
            
            if not match:
                raise ValueError("Invalid manga URL format")
            
            manga_id = match.group(1)
            manga_name = match.group(2).replace('-', ' ').title()
            
            # Try to get title from page
            title_elem = soup.find('a', {'class': 'link link-hover'})
            if title_elem:
                page_title = title_elem.get_text(strip=True)
                if page_title:
                    manga_name = page_title
            
            info = {
                'manga_id': manga_id,
                'manga_name': manga_name,
                'url': title_url,
                'chapters_count': 0
            }
            
            logger.info(f"Found manga: {manga_name} (ID: {manga_id})")
            return info
            
        except Exception as e:
            logger.error(f"Error fetching manga info: {e}")
            raise
    
    def get_chapters(self, title_url: str) -> List[Dict]:
        """
        Get all chapters for a manga
        
        Args:
            title_url: URL to manga title page
            
        Returns:
            List of chapter dictionaries with id, number, url
        """
        try:
            logger.info(f"Fetching chapters from: {title_url}")
            response = self.session.get(title_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Find all chapter links
            # Pattern: <a href="/title/224523-en-solo-necromancer/9913856-ch-205">Ch.205</a>
            # or: <a href="/title/221667-en-ranker-s-return-remake/6052315-chapter-1">Chapter 1</a>
            chapter_links = soup.find_all('a', {'class': 'link-hover link-primary visited:text-accent'})
            
            chapters = []
            for link in chapter_links:
                href = link.get('href', '')
                chapter_text = link.get_text(strip=True)
                
                # Check for both formats: -ch- and -chapter-
                if '/title/' in href and ('-ch-' in href or '-chapter-' in href):
                    # Extract chapter info from URL
                    # Format: /title/224523-en-solo-necromancer/9913856-ch-205
                    # or: /title/221667-en-ranker-s-return-remake/6052315-chapter-1
                    chapter_pattern = r'/title/\d+-en-[^/]+/(\d+)-(?:ch|chapter)-([\d.]+)'
                    match = re.search(chapter_pattern, href)
                    
                    if match:
                        chapter_id = match.group(1)
                        chapter_num = match.group(2)
                        
                        chapter_info = {
                            'chapter_id': chapter_id,
                            'chapter_number': chapter_num,
                            'chapter_text': chapter_text,
                            'url': self.BASE_URL + href
                        }
                        chapters.append(chapter_info)
            
            # Remove duplicates and sort
            seen = set()
            unique_chapters = []
            for ch in chapters:
                if ch['chapter_id'] not in seen:
                    seen.add(ch['chapter_id'])
                    unique_chapters.append(ch)
            
            # Sort by chapter number
            unique_chapters.sort(key=lambda x: float(x['chapter_number']))
            
            logger.info(f"Found {len(unique_chapters)} chapters")
            return unique_chapters
            
        except Exception as e:
            logger.error(f"Error fetching chapters: {e}")
            raise
    
    async def get_chapter_images(self, chapter_url: str) -> List[str]:
        """
        Get all image URLs from a chapter using Playwright for JavaScript rendering
        MangaPark uses a paginated reader, so we need to navigate through pages
        
        Args:
            chapter_url: URL to chapter page
            
        Returns:
            List of image URLs sorted by page number
        """
        try:
            logger.info(f"Fetching chapter images from: {chapter_url}")
            
            image_urls = []
            
            async with async_playwright() as p:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                logger.info("Loading chapter page...")
                
                # Navigate to page
                await page.goto(chapter_url, wait_until='domcontentloaded', timeout=60000)
                await page.wait_for_timeout(8000)
                
                # Scroll slowly to trigger all image loads
                logger.info("Scrolling to load all pages...")
                for i in range(40):
                    await page.evaluate("window.scrollBy(0, 500)")
                    await page.wait_for_timeout(1000)
                
                # Scroll back to top
                await page.evaluate("window.scrollTo(0, 0)")
                await page.wait_for_timeout(2000)
                
                # Scroll down again to ensure all images are loaded
                for i in range(25):
                    await page.evaluate("window.scrollBy(0, 400)")
                    await page.wait_for_timeout(500)
                
                await page.wait_for_timeout(2000)
                
                # Debug: Log page content
                logger.info("Checking page structure...")
                page_info = await page.evaluate("""
                    () => {
                        const allImgs = document.querySelectorAll('img');
                        const imgWithIds = document.querySelectorAll('img[id^="p-"]');
                        return {
                            totalImages: allImgs.length,
                            imagesWithPIds: imgWithIds.length,
                            sampleIds: Array.from(imgWithIds).slice(0, 3).map(img => img.id),
                            containerClasses: Array.from(document.querySelectorAll('[class*="reader"], [class*="viewer"]')).map(el => el.className)
                        };
                    }
                """)
                logger.info(f"Page structure: {page_info}")
                
                # Extract images from DOM with their page numbers
                logger.info("Extracting images from DOM...")
                images_data = await page.evaluate("""
                    () => {
                        const images = [];
                        
                        // Try multiple selectors as mangapark structure may change
                        // Strategy 1: Find all img elements with id starting with 'p-'
                        const imgElements1 = document.querySelectorAll('img[id^="p-"]');
                        imgElements1.forEach(img => {
                            const id = img.id;
                            const src = img.src || img.getAttribute('data-src') || img.getAttribute('src');
                            const pageMatch = id.match(/p-(\\d+)/);
                            if (pageMatch && src && src.startsWith('http')) {
                                images.push({
                                    page: parseInt(pageMatch[1]),
                                    url: src
                                });
                            }
                        });
                        
                        // Strategy 2: Find images in reader container
                        if (images.length === 0) {
                            const readerImages = document.querySelectorAll('.reader img, #viewer img, .viewer img, [class*="reader"] img');
                            readerImages.forEach((img, idx) => {
                                const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                                if (src && src.startsWith('http')) {
                                    images.push({
                                        page: idx + 1,
                                        url: src
                                    });
                                }
                            });
                        }
                        
                        // Strategy 3: Find all images with specific data attributes
                        if (images.length === 0) {
                            const dataImages = document.querySelectorAll('img[data-src], img[data-lazy-src]');
                            dataImages.forEach((img, idx) => {
                                const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                                if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
                                    images.push({
                                        page: idx + 1,
                                        url: src
                                    });
                                }
                            });
                        }
                        
                        // Strategy 4: Find all large images (manga pages are usually large)
                        if (images.length === 0) {
                            const allImages = document.querySelectorAll('img');
                            allImages.forEach((img, idx) => {
                                const src = img.src || img.getAttribute('data-src') || img.getAttribute('src');
                                // Filter out small images (logos, icons, etc.)
                                if (src && src.startsWith('http') && 
                                    img.naturalWidth > 500 && 
                                    !src.includes('logo') && 
                                    !src.includes('icon') &&
                                    !src.includes('avatar')) {
                                    images.push({
                                        page: idx + 1,
                                        url: src
                                    });
                                }
                            });
                        }
                        
                        return images;
                    }
                """)
                
                # Debug: Take screenshot if no images found
                if not images_data or len(images_data) == 0:
                    logger.warning("No images found, taking screenshot for debugging...")
                    try:
                        await page.screenshot(path='/tmp/mangapark_debug.png')
                        logger.info("Screenshot saved to /tmp/mangapark_debug.png")
                    except Exception as e:
                        logger.error(f"Failed to save screenshot: {e}")
                
                await browser.close()
                
                # Sort by page number
                if images_data:
                    sorted_images = sorted(images_data, key=lambda x: x['page'])
                    image_urls = [img['url'] for img in sorted_images]
                    logger.info(f"Found and sorted {len(image_urls)} images by page number")
                    
                    # Log first few page numbers for verification
                    page_numbers = [img['page'] for img in sorted_images[:5]]
                    logger.info(f"First 5 page numbers: {page_numbers}")
                else:
                    logger.warning("No images found with page IDs, using empty list")
                    image_urls = []
            
            logger.info(f"Returning {len(image_urls)} images total")
            return image_urls
            
        except Exception as e:
            logger.error(f"Error fetching chapter images: {e}")
            raise
    
    def download_image(self, image_url: str, output_path: Path) -> bool:
        """
        Download a single image
        
        Args:
            image_url: URL of the image
            output_path: Path to save the image
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.session.get(image_url, timeout=15, stream=True)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded: {output_path.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading image {image_url}: {e}")
            return False
    
    async def download_chapter(self, chapter_url: str, manga_name: Optional[str] = None, 
                        chapter_num: Optional[str] = None) -> Dict:
        """
        Download all images from a chapter
        
        Args:
            chapter_url: URL to chapter page
            manga_name: Optional manga name for folder structure
            chapter_num: Optional chapter number for folder name
            
        Returns:
            Dictionary with download results
        """
        try:
            # Extract chapter info from URL if not provided
            if not chapter_num:
                # Handle both formats: -ch-205 and -chapter-1
                match = re.search(r'-(?:ch|chapter)-([\d.]+)', chapter_url)
                chapter_num = match.group(1) if match else "unknown"
            
            if not manga_name:
                match = re.search(r'/title/\d+-en-([^/]+)/', chapter_url)
                manga_name = match.group(1).replace('-', '_') if match else "unknown_manga"
            else:
                manga_name = manga_name.replace(' ', '_').lower()
            
            # Create output directory
            chapter_dir = self.download_dir / manga_name / f"chapter_{chapter_num}"
            chapter_dir.mkdir(parents=True, exist_ok=True)
            
            # Get image URLs
            image_urls = await self.get_chapter_images(chapter_url)
            
            if not image_urls:
                logger.warning("No images found in chapter")
                return {
                    'success': False,
                    'chapter_url': chapter_url,
                    'message': 'No images found'
                }
            
            # Download images
            downloaded = 0
            failed = 0
            
            for idx, img_url in enumerate(image_urls, 1):
                # Get file extension
                ext = '.jpg'
                if '.png' in img_url.lower():
                    ext = '.png'
                elif '.jpeg' in img_url.lower():
                    ext = '.jpeg'
                
                output_file = chapter_dir / f"page_{idx:03d}{ext}"
                
                if self.download_image(img_url, output_file):
                    downloaded += 1
                else:
                    failed += 1
                
                # Be polite to the server
                time.sleep(0.5)
            
            result = {
                'success': True,
                'chapter_url': chapter_url,
                'chapter_number': chapter_num,
                'manga_name': manga_name,
                'output_dir': str(chapter_dir),
                'total_images': len(image_urls),
                'downloaded': downloaded,
                'failed': failed
            }
            
            logger.info(f"Chapter download complete: {downloaded}/{len(image_urls)} images")
            return result
            
        except Exception as e:
            logger.error(f"Error downloading chapter: {e}")
            return {
                'success': False,
                'chapter_url': chapter_url,
                'error': str(e)
            }
    
    async def download_manga(self, title_url: str, start_chapter: Optional[int] = None, 
                      end_chapter: Optional[int] = None) -> Dict:
        """
        Download multiple chapters of a manga
        
        Args:
            title_url: URL to manga title page
            start_chapter: Starting chapter number (inclusive)
            end_chapter: Ending chapter number (inclusive)
            
        Returns:
            Dictionary with download results
        """
        try:
            # Get manga info
            manga_info = self.get_manga_info(title_url)
            manga_name = manga_info['manga_name']
            
            # Get chapters
            chapters = self.get_chapters(title_url)
            
            if not chapters:
                return {
                    'success': False,
                    'message': 'No chapters found'
                }
            
            # Filter chapters by range
            if start_chapter is not None or end_chapter is not None:
                start = start_chapter if start_chapter is not None else 0
                end = end_chapter if end_chapter is not None else float('inf')
                
                chapters = [
                    ch for ch in chapters 
                    if start <= float(ch['chapter_number']) <= end
                ]
            
            if not chapters:
                return {
                    'success': False,
                    'message': 'No chapters in specified range'
                }
            
            logger.info(f"Downloading {len(chapters)} chapters of {manga_name}")
            
            # Download each chapter
            results = []
            for ch in chapters:
                logger.info(f"Downloading Chapter {ch['chapter_number']}...")
                result = await self.download_chapter(
                    ch['url'], 
                    manga_name, 
                    ch['chapter_number']
                )
                results.append(result)
                
                # Be polite to the server
                time.sleep(1)
            
            # Summary
            successful = sum(1 for r in results if r.get('success'))
            total_images = sum(r.get('downloaded', 0) for r in results)
            
            return {
                'success': True,
                'manga_name': manga_name,
                'total_chapters': len(chapters),
                'successful_chapters': successful,
                'total_images_downloaded': total_images,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error downloading manga: {e}")
            return {
                'success': False,
                'error': str(e)
            }


if __name__ == "__main__":
    # Test the scraper
    scraper = MangaScraper()
    
    # Test with Solo Necromancer
    test_url = "https://mangapark.net/title/224523-en-solo-necromancer"
    
    print("Testing manga info extraction...")
    info = scraper.get_manga_info(test_url)
    print(f"Manga: {info}")
    
    print("\nTesting chapter list...")
    chapters = scraper.get_chapters(test_url)
    print(f"Found {len(chapters)} chapters")
    if chapters:
        print(f"First chapter: {chapters[0]}")
        print(f"Last chapter: {chapters[-1]}")
    
    # Test image extraction (but don't download yet)
    if chapters:
        print(f"\nTesting image extraction from chapter {chapters[-1]['chapter_number']}...")
        images = scraper.get_chapter_images(chapters[-1]['url'])
        print(f"Found {len(images)} images")
        if images:
            print(f"First image: {images[0]}")
