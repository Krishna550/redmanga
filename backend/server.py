from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app with increased body size limit
app = FastAPI(
    title="Red Manga API",
    description="Manga reader and management API",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Admin password from env
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')


# ============= Models =============

class MangaCreate(BaseModel):
    title: str
    description: str
    author: str
    coverImage: str  # base64 encoded image
    genres: List[str] = []
    status: str = "Ongoing"  # Ongoing, Completed

class Manga(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    author: str
    coverImage: str
    genres: List[str]
    status: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    totalChapters: int = 0

class ChapterCreate(BaseModel):
    mangaId: str
    chapterNumber: float
    title: str
    pages: List[str]  # base64 encoded images

class Chapter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mangaId: str
    chapterNumber: float
    title: str
    pages: List[str]
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminAuth(BaseModel):
    password: str

class SearchQuery(BaseModel):
    query: str

class MangaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    coverImage: Optional[str] = None
    genres: Optional[List[str]] = None
    status: Optional[str] = None

class ChapterUpdate(BaseModel):
    chapterNumber: Optional[float] = None
    title: Optional[str] = None
    pages: Optional[List[str]] = None

class BulkDeleteRequest(BaseModel):
    ids: List[str]


# ============= Helper Functions =============

def verify_admin(authorization: Optional[str] = None):
    """Verify admin password from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin password")
    
    return True


# ============= Routes =============

@api_router.get("/")
async def root():
    return {"message": "Red Manga API - Ready"}


# ============= Admin Routes =============

@api_router.post("/admin/auth")
async def admin_auth(auth: AdminAuth):
    """Verify admin credentials"""
    if auth.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Authentication successful"}
    else:
        raise HTTPException(status_code=403, detail="Invalid password")


@api_router.post("/admin/manga", response_model=Manga)
async def create_manga(manga: MangaCreate, authorization: str = Header(None)):
    """Create a new manga (Admin only)"""
    verify_admin(authorization)
    
    manga_obj = Manga(**manga.model_dump(), totalChapters=0)
    doc = manga_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.manga.insert_one(doc)
    return manga_obj


@api_router.post("/admin/chapter", response_model=Chapter)
async def create_chapter(chapter: ChapterCreate, authorization: str = Header(None)):
    """Add a chapter to manga (Admin only)"""
    try:
        verify_admin(authorization)
        
        # Verify manga exists
        manga = await db.manga.find_one({"id": chapter.mangaId}, {"_id": 0})
        if not manga:
            raise HTTPException(status_code=404, detail="Manga not found")
        
        # Validate chapter data
        if not chapter.pages or len(chapter.pages) == 0:
            raise HTTPException(status_code=400, detail="Chapter must have at least one page")
        
        if len(chapter.pages) > 100:
            raise HTTPException(status_code=400, detail="Chapter cannot have more than 100 pages")
        
        # Create chapter
        chapter_obj = Chapter(**chapter.model_dump())
        doc = chapter_obj.model_dump()
        doc['createdAt'] = doc['createdAt'].isoformat()
        
        await db.chapters.insert_one(doc)
        
        # Update manga's total chapters count
        chapter_count = await db.chapters.count_documents({"mangaId": chapter.mangaId})
        await db.manga.update_one(
            {"id": chapter.mangaId},
            {"$set": {"totalChapters": chapter_count}}
        )
        
        logger.info(f"Created chapter {chapter_obj.chapterNumber} for manga {chapter.mangaId}")
        return chapter_obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create chapter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create chapter: {str(e)}")


@api_router.delete("/admin/manga/{manga_id}")
async def delete_manga(manga_id: str, authorization: str = Header(None)):
    """Delete manga and all its chapters (Admin only)"""
    verify_admin(authorization)
    
    # Delete manga
    result = await db.manga.delete_one({"id": manga_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Manga not found")
    
    # Delete all chapters
    await db.chapters.delete_many({"mangaId": manga_id})
    
    return {"success": True, "message": "Manga and chapters deleted"}


@api_router.delete("/admin/chapter/{chapter_id}")
async def delete_chapter(chapter_id: str, authorization: str = Header(None)):
    """Delete a chapter (Admin only)"""
    verify_admin(authorization)
    
    chapter = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    manga_id = chapter['mangaId']
    
    # Delete chapter
    await db.chapters.delete_one({"id": chapter_id})
    
    # Update manga's total chapters count
    chapter_count = await db.chapters.count_documents({"mangaId": manga_id})
    await db.manga.update_one(
        {"id": manga_id},
        {"$set": {"totalChapters": chapter_count}}
    )
    
    return {"success": True, "message": "Chapter deleted"}


@api_router.put("/admin/manga/{manga_id}", response_model=Manga)
async def update_manga(manga_id: str, manga_update: MangaUpdate, authorization: str = Header(None)):
    """Update manga details (Admin only)"""
    verify_admin(authorization)
    
    # Check if manga exists
    existing_manga = await db.manga.find_one({"id": manga_id}, {"_id": 0})
    if not existing_manga:
        raise HTTPException(status_code=404, detail="Manga not found")
    
    # Build update dict with only provided fields
    update_data = {k: v for k, v in manga_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update manga
    await db.manga.update_one(
        {"id": manga_id},
        {"$set": update_data}
    )
    
    # Get updated manga
    updated_manga = await db.manga.find_one({"id": manga_id}, {"_id": 0})
    if isinstance(updated_manga.get('createdAt'), str):
        updated_manga['createdAt'] = datetime.fromisoformat(updated_manga['createdAt'])
    
    return updated_manga


@api_router.put("/admin/chapter/{chapter_id}", response_model=Chapter)
async def update_chapter(chapter_id: str, chapter_update: ChapterUpdate, authorization: str = Header(None)):
    """Update chapter details (Admin only)"""
    verify_admin(authorization)
    
    # Check if chapter exists
    existing_chapter = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
    if not existing_chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Build update dict with only provided fields
    update_data = {k: v for k, v in chapter_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update chapter
    await db.chapters.update_one(
        {"id": chapter_id},
        {"$set": update_data}
    )
    
    # Get updated chapter
    updated_chapter = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
    if isinstance(updated_chapter.get('createdAt'), str):
        updated_chapter['createdAt'] = datetime.fromisoformat(updated_chapter['createdAt'])
    
    return updated_chapter


@api_router.post("/admin/manga/bulk-delete")
async def bulk_delete_manga(request: BulkDeleteRequest, authorization: str = Header(None)):
    """Bulk delete manga (Admin only)"""
    verify_admin(authorization)
    
    # Delete all manga
    result = await db.manga.delete_many({"id": {"$in": request.ids}})
    
    # Delete all associated chapters
    await db.chapters.delete_many({"mangaId": {"$in": request.ids}})
    
    return {"success": True, "deleted": result.deleted_count}


@api_router.post("/admin/chapters/bulk-delete")
async def bulk_delete_chapters(request: BulkDeleteRequest, authorization: str = Header(None)):
    """Bulk delete chapters (Admin only)"""
    verify_admin(authorization)
    
    # Get all chapters to find their manga IDs
    chapters = await db.chapters.find({"id": {"$in": request.ids}}, {"_id": 0, "mangaId": 1}).to_list(1000)
    manga_ids = list(set([c['mangaId'] for c in chapters]))
    
    # Delete chapters
    result = await db.chapters.delete_many({"id": {"$in": request.ids}})
    
    # Update chapter counts for affected manga
    for manga_id in manga_ids:
        chapter_count = await db.chapters.count_documents({"mangaId": manga_id})
        await db.manga.update_one(
            {"id": manga_id},
            {"$set": {"totalChapters": chapter_count}}
        )
    
    return {"success": True, "deleted": result.deleted_count}


@api_router.get("/admin/statistics")
async def get_statistics(authorization: str = Header(None)):
    """Get admin statistics (Admin only)"""
    verify_admin(authorization)
    
    total_manga = await db.manga.count_documents({})
    total_chapters = await db.chapters.count_documents({})
    
    # Get manga with most chapters
    pipeline = [
        {"$group": {"_id": "$mangaId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    top_chapter_result = await db.chapters.aggregate(pipeline).to_list(1)
    
    # Get recent manga
    recent_manga = await db.manga.find({}, {"_id": 0, "id": 1, "title": 1, "createdAt": 1}).sort("createdAt", -1).limit(5).to_list(5)
    
    return {
        "totalManga": total_manga,
        "totalChapters": total_chapters,
        "averageChaptersPerManga": round(total_chapters / total_manga, 2) if total_manga > 0 else 0,
        "recentManga": recent_manga
    }


# ============= Public Routes =============

@api_router.get("/manga", response_model=List[Manga])
async def get_all_manga(limit: int = 50, skip: int = 0):
    """Get all manga (paginated)"""
    manga_list = await db.manga.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for manga in manga_list:
        if isinstance(manga.get('createdAt'), str):
            manga['createdAt'] = datetime.fromisoformat(manga['createdAt'])
    
    return manga_list


@api_router.get("/manga/{manga_id}", response_model=Manga)
async def get_manga_details(manga_id: str):
    """Get manga details by ID"""
    manga = await db.manga.find_one({"id": manga_id}, {"_id": 0})
    
    if not manga:
        raise HTTPException(status_code=404, detail="Manga not found")
    
    if isinstance(manga.get('createdAt'), str):
        manga['createdAt'] = datetime.fromisoformat(manga['createdAt'])
    
    return manga


@api_router.get("/manga/{manga_id}/chapters")
async def get_manga_chapters(manga_id: str):
    """Get all chapters for a manga"""
    chapters = await db.chapters.find(
        {"mangaId": manga_id}, 
        {"_id": 0, "pages": 0}  # Exclude pages for list view
    ).sort("chapterNumber", 1).to_list(1000)
    
    for chapter in chapters:
        if isinstance(chapter.get('createdAt'), str):
            chapter['createdAt'] = datetime.fromisoformat(chapter['createdAt'])
        # Add empty pages array for compatibility
        chapter['pages'] = []
    
    return chapters


@api_router.get("/chapter/{chapter_id}", response_model=Chapter)
async def get_chapter_details(chapter_id: str):
    """Get chapter details including all pages"""
    chapter = await db.chapters.find_one({"id": chapter_id}, {"_id": 0})
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if isinstance(chapter.get('createdAt'), str):
        chapter['createdAt'] = datetime.fromisoformat(chapter['createdAt'])
    
    return chapter


@api_router.get("/search")
async def search_manga(q: str):
    """Search manga by title"""
    if not q or len(q.strip()) < 2:
        return []
    
    # Case-insensitive search
    manga_list = await db.manga.find(
        {"title": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).limit(20).to_list(20)
    
    for manga in manga_list:
        if isinstance(manga.get('createdAt'), str):
            manga['createdAt'] = datetime.fromisoformat(manga['createdAt'])
    
    return manga_list


@api_router.get("/featured")
async def get_featured_manga(limit: int = 6):
    """Get featured manga (most recent)"""
    manga_list = await db.manga.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit).to_list(limit)
    
    for manga in manga_list:
        if isinstance(manga.get('createdAt'), str):
            manga['createdAt'] = datetime.fromisoformat(manga['createdAt'])
    
    return manga_list


# Add CORS middleware FIRST
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
