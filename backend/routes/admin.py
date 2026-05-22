from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from encryption import decrypt_image
from models import User, Conversation, Message
from schemas import RejectRegistrationRequest
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


@router.get("/pending-registrations")
async def list_pending_registrations(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.registration_status == "pending")
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "id_number": u.id_number,
            "id_card_image": decrypt_image(u.id_card_image) if u.id_card_image else None,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/pending-count")
async def pending_registration_count(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count()).select_from(User).where(User.registration_status == "pending")
    )
    return {"count": result.scalar()}


@router.put("/registrations/{user_id}/approve")
async def approve_registration(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.registration_status != "pending":
        raise HTTPException(status_code=400, detail="Registration is not in pending state")

    user.registration_status = "approved"
    user.id_card_image = None
    await db.commit()
    return {"status": "approved", "user_id": user.id}


@router.put("/registrations/{user_id}/permanently-block")
async def permanently_block_registration(
    user_id: str,
    body: RejectRegistrationRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.registration_status != "pending":
        raise HTTPException(status_code=400, detail="Registration is not in pending state")

    user.registration_status = "rejected"
    user.blocked = True
    user.blocked_reason = body.reason
    user.id_card_image = None
    await db.commit()
    return {"status": "rejected", "user_id": user.id}


@router.put("/registrations/{user_id}/request-changes")
async def request_changes_registration(
    user_id: str,
    body: RejectRegistrationRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.registration_status != "pending":
        raise HTTPException(status_code=400, detail="Registration is not in pending state")

    user.registration_status = "changes_requested"
    user.blocked_reason = body.reason
    await db.commit()
    return {"status": "changes_requested", "user_id": user.id}
