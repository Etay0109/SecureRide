from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, Conversation, Message
from routes.auth import require_admin

router = APIRouter()


@router.get("/blocked-users")
async def list_blocked_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.blocked == True)  # noqa: E712
    )
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "blocked_reason": u.blocked_reason,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.put("/users/{target_user_id}/unblock")
async def unblock_user(
    target_user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == target_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.blocked = False
    user.blocked_reason = None
    await db.commit()
    return {"status": "unblocked", "user_id": user.id}


@router.put("/users/{target_user_id}/block")
async def block_user(
    target_user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == target_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.blocked = True
    if not user.blocked_reason:
        user.blocked_reason = "Blocked by admin"
    await db.commit()
    return {"status": "blocked", "user_id": user.id}


@router.post("/chat/{target_user_id}")
async def start_admin_chat(
    target_user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Start or get existing admin chat with a user."""
    target = (await db.execute(select(User).where(User.id == target_user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (await db.execute(
        select(Conversation).where(
            Conversation.is_admin_chat == True,  # noqa: E712
            or_(
                (Conversation.buyer_id == admin.id) & (Conversation.seller_id == target_user_id),
                (Conversation.buyer_id == target_user_id) & (Conversation.seller_id == admin.id),
            ),
        )
    )).scalar_one_or_none()

    if existing:
        return {"conversation_id": existing.id}

    conv = Conversation(
        listing_id=None,
        buyer_id=target_user_id,
        seller_id=admin.id,
        is_admin_chat=True,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return {"conversation_id": conv.id}
