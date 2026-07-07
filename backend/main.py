import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Vehicle
from storage import UPLOAD_ROOT
from routes.auth import router as auth_router
from routes.verify import router as verify_router
from routes.sell import router as sell_router
from routes.chat import router as chat_router
from routes.trade import router as trade_router
from routes.admin import router as admin_router
from routes.recommendations import router as recommendations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic; nothing to build at startup.
    yield


app = FastAPI(title="SecureRide API", lifespan=lifespan)

_DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:5174,http://localhost:5175"
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(verify_router, prefix="/api/verify", tags=["verify"])
app.include_router(sell_router, prefix="/api/sell", tags=["sell"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(trade_router, prefix="/api/trades", tags=["trades"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["recommendations"])

# Serve uploaded listing photos from disk instead of shipping base64 in the DB.
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(Vehicle))
    count = result.scalar()
    return {"vehicles_verified": count}
