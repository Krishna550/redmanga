from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import httpx
from bs4 import BeautifulSoup
import re
from typing import List

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChapterRequest(BaseModel):
    chapter_url: str


class ChapterResponse(BaseModel):
    image_urls: List[str]
    total_pages: int


@app.get("/api/")
def read_root():
    return {"message": "Manga Reader API - Ready"}


@app.post("/api/extract-chapter", response_model=ChapterResponse)
async def extract_chapter(request: ChapterRequest):
    """
    Extract manga page image URLs from a chapter URL.
    Supports common manga reader websites.
    """
    try:
        # Fetch the chapter page
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=30.0,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': request.chapter_url,
            }
        ) as client:
            response = await client.get(request.chapter_url)
            response.raise_for_status()
            html_content = response.text

        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract image URLs using multiple strategies
        image_urls = set()
        
        # Strategy 1: Find all img tags with common manga reader attributes
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src and is_valid_manga_image(src):
                image_urls.add(normalize_url(src, request.chapter_url))
        
        # Strategy 2: Look for common manga reader containers
        manga_containers = soup.find_all(['div', 'section'], class_=re.compile(r'(page|chapter|manga|reader|viewer|panel)', re.I))
        for container in manga_containers:
            for img in container.find_all('img'):
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if src and is_valid_manga_image(src):
                    image_urls.add(normalize_url(src, request.chapter_url))
        
        # Strategy 3: Check for JSON data in script tags (some sites load images via JS)
        for script in soup.find_all('script'):
            script_text = script.string or ''
            # Look for image URLs in JSON or JS arrays
            urls_in_script = re.findall(r'["\']https?://[^"\s]+\.(?:jpg|jpeg|png|webp|gif)["\']', script_text, re.I)
            for url_match in urls_in_script:
                url = url_match.strip('"\'')
                if is_valid_manga_image(url):
                    image_urls.add(url)
        
        # Convert to sorted list (some sites have numbered filenames)
        image_urls_list = sorted(list(image_urls))
        
        if not image_urls_list:
            raise HTTPException(
                status_code=404,
                detail="No manga page images found. The website might be using dynamic loading or has CORS restrictions. Try entering image URLs manually."
            )
        
        return ChapterResponse(
            image_urls=image_urls_list,
            total_pages=len(image_urls_list)
        )
    
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chapter page: {str(e)}. The website might be blocking automated requests."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting manga pages: {str(e)}"
        )


def is_valid_manga_image(url: str) -> bool:
    """Check if URL is likely a manga page image."""
    if not url:
        return False
    
    # Must be an image file
    if not re.search(r'\.(jpg|jpeg|png|webp|gif)($|\?)', url, re.I):
        return False
    
    # Exclude common non-manga images
    exclude_patterns = [
        r'logo', r'icon', r'avatar', r'banner', r'ad[_-]',
        r'thumb', r'cover', r'button', r'sprite'
    ]
    
    for pattern in exclude_patterns:
        if re.search(pattern, url, re.I):
            return False
    
    return True


def normalize_url(url: str, base_url: str) -> str:
    """Normalize relative URLs to absolute URLs."""
    if url.startswith('http'):
        return url
    elif url.startswith('//'):
        return 'https:' + url
    elif url.startswith('/'):
        # Absolute path
        from urllib.parse import urlparse
        parsed = urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{url}"
    else:
        # Relative path
        from urllib.parse import urljoin
        return urljoin(base_url, url)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)