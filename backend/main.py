from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import create_tables, get_db
from models import Vehicle
from routes.auth import router as auth_router
from routes.verify import router as verify_router
from routes.sell import router as sell_router
from routes.chat import router as chat_router
from routes.trade import router as trade_router
from routes.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="SecureRide API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(Vehicle))
    count = result.scalar()
    return {"vehicles_verified": count}
