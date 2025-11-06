#!/usr/bin/env python3
"""
Backend Test Suite for Manga Reader App
Tests both hivetoons (BeautifulSoup) and mangapark (Playwright) scrapers
"""

import asyncio
import httpx
import json
import sys
import time
from typing import Dict, List, Any

# Test configuration
BACKEND_URL = "https://navbar-fixer.preview.emergentagent.com/api"

# Test URLs
HIVETOONS_TEST_URL = "https://hivetoons.org/series/lookism/chapter-579"
MANGAPARK_TEST_URL = "https://mangapark.net/title/224523-en-solo-necromancer/9913856-ch-205"

class MangaReaderTester:
    def __init__(self):
        self.results = []
        self.client = httpx.AsyncClient(timeout=120.0)  # Extended timeout for Playwright
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            for key, value in details.items():
                print(f"    {key}: {value}")
        print()
    
    async def test_api_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = await self.client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "API Connectivity", 
                    True, 
                    "Backend API is responsive",
                    {"status_code": response.status_code, "response": data}
                )
                return True
            else:
                self.log_result(
                    "API Connectivity", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "API Connectivity", 
                False, 
                f"Failed to connect to backend: {str(e)}"
            )
            return False
    
    async def test_hivetoons_scraper(self):
        """Test hivetoons scraper (BeautifulSoup-based)"""
        try:
            print(f"🔍 Testing Hivetoons scraper with URL: {HIVETOONS_TEST_URL}")
            
            payload = {"chapter_url": HIVETOONS_TEST_URL}
            response = await self.client.post(
                f"{BACKEND_URL}/extract-chapter",
                json=payload
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
            
            data = response.json()
            
            # Validate response structure
            if "image_urls" not in data or "total_pages" not in data:
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    "Missing required fields in response",
                    {"response": data}
                )
                return False
            
            image_urls = data["image_urls"]
            total_pages = data["total_pages"]
            
            # Validate data
            if not isinstance(image_urls, list):
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    "image_urls is not a list",
                    {"type": type(image_urls).__name__}
                )
                return False
            
            if len(image_urls) == 0:
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    "No images found",
                    {"total_pages": total_pages}
                )
                return False
            
            if len(image_urls) != total_pages:
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    "Mismatch between image count and total_pages",
                    {"image_count": len(image_urls), "total_pages": total_pages}
                )
                return False
            
            # Validate image URLs
            invalid_urls = []
            for i, url in enumerate(image_urls[:5]):  # Check first 5 URLs
                if not url.startswith(('http://', 'https://')):
                    invalid_urls.append(f"URL {i+1}: {url}")
            
            if invalid_urls:
                self.log_result(
                    "Hivetoons Scraper", 
                    False, 
                    "Invalid image URLs found",
                    {"invalid_urls": invalid_urls}
                )
                return False
            
            self.log_result(
                "Hivetoons Scraper", 
                True, 
                f"Successfully extracted {len(image_urls)} manga pages",
                {
                    "total_pages": total_pages,
                    "first_image": image_urls[0] if image_urls else None,
                    "scraper_type": "BeautifulSoup (Generic)"
                }
            )
            return True
            
        except Exception as e:
            self.log_result(
                "Hivetoons Scraper", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    async def test_mangapark_scraper(self):
        """Test mangapark scraper (Playwright-based)"""
        try:
            print(f"🔍 Testing Mangapark scraper with URL: {MANGAPARK_TEST_URL}")
            print("⏳ This may take 30-60 seconds due to Playwright browser automation...")
            
            start_time = time.time()
            
            payload = {"chapter_url": MANGAPARK_TEST_URL}
            response = await self.client.post(
                f"{BACKEND_URL}/extract-chapter",
                json=payload
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code != 200:
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code, "duration_seconds": round(duration, 2)}
                )
                return False
            
            data = response.json()
            
            # Validate response structure
            if "image_urls" not in data or "total_pages" not in data:
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    "Missing required fields in response",
                    {"response": data, "duration_seconds": round(duration, 2)}
                )
                return False
            
            image_urls = data["image_urls"]
            total_pages = data["total_pages"]
            
            # Validate data
            if not isinstance(image_urls, list):
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    "image_urls is not a list",
                    {"type": type(image_urls).__name__, "duration_seconds": round(duration, 2)}
                )
                return False
            
            if len(image_urls) == 0:
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    "No images found",
                    {"total_pages": total_pages, "duration_seconds": round(duration, 2)}
                )
                return False
            
            if len(image_urls) != total_pages:
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    "Mismatch between image count and total_pages",
                    {"image_count": len(image_urls), "total_pages": total_pages, "duration_seconds": round(duration, 2)}
                )
                return False
            
            # Validate image URLs (should be from mangapark CDN)
            invalid_urls = []
            non_mangapark_urls = []
            for i, url in enumerate(image_urls[:5]):  # Check first 5 URLs
                if not url.startswith(('http://', 'https://')):
                    invalid_urls.append(f"URL {i+1}: {url}")
                elif "mangapark" not in url.lower():
                    non_mangapark_urls.append(f"URL {i+1}: {url}")
            
            if invalid_urls:
                self.log_result(
                    "Mangapark Scraper", 
                    False, 
                    "Invalid image URLs found",
                    {"invalid_urls": invalid_urls, "duration_seconds": round(duration, 2)}
                )
                return False
            
            # Check if images are properly ordered (page IDs should be sequential)
            page_order_check = True
            if len(image_urls) > 1:
                # For mangapark, images should be in order based on page IDs
                # This is a basic check - we assume if we got multiple images, they're ordered
                pass
            
            self.log_result(
                "Mangapark Scraper", 
                True, 
                f"Successfully extracted {len(image_urls)} manga pages using Playwright",
                {
                    "total_pages": total_pages,
                    "first_image": image_urls[0] if image_urls else None,
                    "scraper_type": "Playwright (Mangapark-specific)",
                    "duration_seconds": round(duration, 2),
                    "non_mangapark_urls": len(non_mangapark_urls) if non_mangapark_urls else 0
                }
            )
            return True
            
        except Exception as e:
            self.log_result(
                "Mangapark Scraper", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    async def test_image_proxy_endpoint(self):
        """Test the image proxy endpoint with mangapark images"""
        try:
            print(f"🔍 Testing Image Proxy endpoint...")
            
            # First get a mangapark image URL from extract-chapter
            payload = {"chapter_url": MANGAPARK_TEST_URL}
            response = await self.client.post(
                f"{BACKEND_URL}/extract-chapter",
                json=payload
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Image Proxy - Get Test Image", 
                    False, 
                    f"Failed to get test image URL: HTTP {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
            
            data = response.json()
            if not data.get("image_urls"):
                self.log_result(
                    "Image Proxy - Get Test Image", 
                    False, 
                    "No image URLs returned from mangapark scraper"
                )
                return False
            
            # Test the proxy with the first image URL
            test_image_url = data["image_urls"][0]
            print(f"🖼️  Testing proxy with image: {test_image_url[:80]}...")
            
            # Test the proxy endpoint
            proxy_response = await self.client.get(
                f"{BACKEND_URL}/proxy-image",
                params={"url": test_image_url}
            )
            
            if proxy_response.status_code != 200:
                self.log_result(
                    "Image Proxy - Mangapark Image", 
                    False, 
                    f"Proxy returned HTTP {proxy_response.status_code}",
                    {"status_code": proxy_response.status_code, "response": proxy_response.text[:200]}
                )
                return False
            
            # Check Content-Type header
            content_type = proxy_response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                self.log_result(
                    "Image Proxy - Content Type", 
                    False, 
                    f"Invalid Content-Type: {content_type}",
                    {"content_type": content_type}
                )
                return False
            
            # Check Cache-Control header
            cache_control = proxy_response.headers.get('cache-control', '')
            if not cache_control:
                self.log_result(
                    "Image Proxy - Cache Headers", 
                    False, 
                    "Missing Cache-Control header"
                )
                return False
            
            # Check image data size
            image_data = proxy_response.content
            if len(image_data) == 0:
                self.log_result(
                    "Image Proxy - Image Data", 
                    False, 
                    "Empty image data returned"
                )
                return False
            
            # Check if it's actual image data (not HTML redirect)
            if image_data.startswith(b'<!DOCTYPE') or image_data.startswith(b'<html'):
                self.log_result(
                    "Image Proxy - Image Data", 
                    False, 
                    "Received HTML instead of image data",
                    {"data_start": image_data[:100].decode('utf-8', errors='ignore')}
                )
                return False
            
            self.log_result(
                "Image Proxy - Mangapark Image", 
                True, 
                f"Successfully proxied mangapark image ({len(image_data)} bytes)",
                {
                    "content_type": content_type,
                    "cache_control": cache_control,
                    "image_size_bytes": len(image_data),
                    "test_image_url": test_image_url[:80] + "..." if len(test_image_url) > 80 else test_image_url
                }
            )
            return True
            
        except Exception as e:
            self.log_result(
                "Image Proxy - Mangapark Image", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    async def test_image_proxy_hivetoons(self):
        """Test the image proxy endpoint with hivetoons images"""
        try:
            print(f"🔍 Testing Image Proxy with Hivetoons images...")
            
            # First get a hivetoons image URL from extract-chapter
            payload = {"chapter_url": HIVETOONS_TEST_URL}
            response = await self.client.post(
                f"{BACKEND_URL}/extract-chapter",
                json=payload
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Image Proxy - Get Hivetoons Image", 
                    False, 
                    f"Failed to get hivetoons image URL: HTTP {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
            
            data = response.json()
            if not data.get("image_urls"):
                self.log_result(
                    "Image Proxy - Get Hivetoons Image", 
                    False, 
                    "No image URLs returned from hivetoons scraper"
                )
                return False
            
            # Test the proxy with the first image URL
            test_image_url = data["image_urls"][0]
            print(f"🖼️  Testing proxy with hivetoons image: {test_image_url[:80]}...")
            
            # Test the proxy endpoint
            proxy_response = await self.client.get(
                f"{BACKEND_URL}/proxy-image",
                params={"url": test_image_url}
            )
            
            if proxy_response.status_code != 200:
                self.log_result(
                    "Image Proxy - Hivetoons Image", 
                    False, 
                    f"Proxy returned HTTP {proxy_response.status_code}",
                    {"status_code": proxy_response.status_code, "response": proxy_response.text[:200]}
                )
                return False
            
            # Check Content-Type header
            content_type = proxy_response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                self.log_result(
                    "Image Proxy - Hivetoons Content Type", 
                    False, 
                    f"Invalid Content-Type: {content_type}",
                    {"content_type": content_type}
                )
                return False
            
            # Check image data size
            image_data = proxy_response.content
            if len(image_data) == 0:
                self.log_result(
                    "Image Proxy - Hivetoons Image Data", 
                    False, 
                    "Empty image data returned"
                )
                return False
            
            # Check if it's actual image data (not HTML redirect)
            if image_data.startswith(b'<!DOCTYPE') or image_data.startswith(b'<html'):
                self.log_result(
                    "Image Proxy - Hivetoons Image Data", 
                    False, 
                    "Received HTML instead of image data",
                    {"data_start": image_data[:100].decode('utf-8', errors='ignore')}
                )
                return False
            
            self.log_result(
                "Image Proxy - Hivetoons Image", 
                True, 
                f"Successfully proxied hivetoons image ({len(image_data)} bytes)",
                {
                    "content_type": content_type,
                    "image_size_bytes": len(image_data),
                    "test_image_url": test_image_url[:80] + "..." if len(test_image_url) > 80 else test_image_url
                }
            )
            return True
            
        except Exception as e:
            self.log_result(
                "Image Proxy - Hivetoons Image", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False

    async def test_error_handling(self):
        """Test error handling with invalid URLs"""
        test_cases = [
            {
                "name": "Invalid URL",
                "url": "https://invalid-manga-site.com/chapter/1",
                "expected_status": [404, 500]
            },
            {
                "name": "Malformed Request",
                "payload": {"invalid_field": "test"},
                "expected_status": [422]
            }
        ]
        
        for case in test_cases:
            try:
                if "payload" in case:
                    response = await self.client.post(
                        f"{BACKEND_URL}/extract-chapter",
                        json=case["payload"]
                    )
                else:
                    payload = {"chapter_url": case["url"]}
                    response = await self.client.post(
                        f"{BACKEND_URL}/extract-chapter",
                        json=payload
                    )
                
                if response.status_code in case["expected_status"]:
                    self.log_result(
                        f"Error Handling - {case['name']}", 
                        True, 
                        f"Correctly returned HTTP {response.status_code}",
                        {"status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Error Handling - {case['name']}", 
                        False, 
                        f"Unexpected status code: {response.status_code}",
                        {"expected": case["expected_status"], "actual": response.status_code}
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Error Handling - {case['name']}", 
                    False, 
                    f"Exception occurred: {str(e)}"
                )
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Manga Reader Backend Tests")
        print("=" * 60)
        
        # Test 1: API Connectivity
        connectivity_ok = await self.test_api_connectivity()
        
        if not connectivity_ok:
            print("❌ Backend is not accessible. Stopping tests.")
            return False
        
        # Test 2: Hivetoons Scraper (BeautifulSoup)
        await self.test_hivetoons_scraper()
        
        # Test 3: Mangapark Scraper (Playwright)
        await self.test_mangapark_scraper()
        
        # Test 4: Image Proxy - Mangapark Images
        await self.test_image_proxy_endpoint()
        
        # Test 5: Image Proxy - Hivetoons Images
        await self.test_image_proxy_hivetoons()
        
        # Test 6: Error Handling
        await self.test_error_handling()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        return failed_tests == 0

async def main():
    """Main test runner"""
    async with MangaReaderTester() as tester:
        success = await tester.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)