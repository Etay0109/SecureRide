from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from sqlalchemy import select, or_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Conversation, Message, Listing, User, Vehicle, UserInteraction
from schemas import (
    StartConversationRequest, SendMessageRequest,
    MessageResponse, ConversationResponse,
)
from routes.auth import require_active_user, require_auth

router = APIRouter()


# Create a new conversation or return an existing one for a listing.
@router.post("/conversations")
async def start_conversation(
    body: StartConversationRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(select(Listing).where(Listing.id == body.listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.seller_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot start a conversation on your own listing")

    existing = await db.execute(
        select(Conversation).where(
            Conversation.listing_id == body.listing_id,
            Conversation.buyer_id == user_id,
        )
    )
    conv = existing.scalar_one_or_none()
    if conv:
        return {"id": conv.id}

    conv = Conversation(
        listing_id=body.listing_id,
        buyer_id=user_id,
        seller_id=listing.seller_id,
    )
    db.add(conv)

    db.add(UserInteraction(
        user_id=user_id,
        listing_id=body.listing_id,
        action_type="chat",
    ))

    await db.commit()
    await db.refresh(conv)
    return {"id": conv.id}


# Returns all conversations for the authenticated user with their latest message and chat details.
@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    last_msg_subq = (
        select(
            Message.conversation_id,
            func.max(Message.created_at).label("last_at"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    result = await db.execute(
        select(Conversation)
        .where(or_(Conversation.buyer_id == user_id, Conversation.seller_id == user_id))
        .outerjoin(last_msg_subq, Conversation.id == last_msg_subq.c.conversation_id)
        .order_by(func.coalesce(last_msg_subq.c.last_at, Conversation.created_at).desc())
    )
    conversations = result.scalars().all()

    responses = []
    for conv in conversations:
        other_id = conv.seller_id if conv.buyer_id == user_id else conv.buyer_id
        other_user = (await db.execute(select(User).where(User.id == other_id))).scalar_one_or_none()

        listing_title = ""
        if conv.listing_id:
            listing_res = await db.execute(
                select(Listing, Vehicle)
                .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
                .where(Listing.id == conv.listing_id)
            )
            row = listing_res.one_or_none()
            if row:
                l, v = row
                listing_title = f"{v.brand or 'Unknown'} {v.model or ''}".strip()

        if conv.is_admin_chat:
            listing_title = "Admin Support"

        last_msg_res = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_res.scalar_one_or_none()

        responses.append(ConversationResponse(
            id=conv.id,
            listing_id=conv.listing_id or "",
            buyer_id=conv.buyer_id,
            seller_id=conv.seller_id,
            created_at=conv.created_at,
            other_user_first_name=other_user.first_name if other_user else None,
            other_user_last_name=other_user.last_name if other_user else None,
            listing_title=listing_title,
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
        ))

    return responses


# Return details for a specific conversation.
@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not a participant")

    other_id = conv.seller_id if conv.buyer_id == user_id else conv.buyer_id
    other_user = (await db.execute(select(User).where(User.id == other_id))).scalar_one_or_none()

    listing_title = ""
    listing_price = 0
    if conv.listing_id:
        listing_res = await db.execute(
            select(Listing, Vehicle)
            .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
            .where(Listing.id == conv.listing_id)
        )
        row = listing_res.one_or_none()
        if row:
            l, v = row
            listing_title = f"{v.brand or 'Unknown'} {v.model or ''}".strip()
            listing_price = l.price

    if conv.is_admin_chat:
        listing_title = "Admin Support"

    return {
        "id": conv.id,
        "listing_id": conv.listing_id or "",
        "buyer_id": conv.buyer_id,
        "seller_id": conv.seller_id,
        "other_user_first_name": other_user.first_name if other_user else None,
        "other_user_last_name": other_user.last_name if other_user else None,
        "listing_title": listing_title,
        "listing_price": listing_price,
        "is_admin_chat": conv.is_admin_chat,
    }


# Return all messages for a conversation.
@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not a participant")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return [MessageResponse.model_validate(m) for m in result.scalars().all()]


# Send a new message in a conversation.
@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not a participant")

    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=user_id,
        content=body.content.strip(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return MessageResponse.model_validate(msg)


# Delete a conversation and all of its messages.
@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not a participant")

    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()
    return {"status": "deleted"}


# Return unread message notifications for the authenticated user.
@router.get("/unread")
async def get_unread_notifications(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    convs_result = await db.execute(
        select(Conversation).where(
            or_(Conversation.buyer_id == user_id, Conversation.seller_id == user_id)
        )
    )
    conversations = convs_result.scalars().all()

    notifications = []
    total_unread = 0

    for conv in conversations:
        is_buyer = conv.buyer_id == user_id
        last_read = conv.buyer_last_read_at if is_buyer else conv.seller_last_read_at

        unread_filter = [
            Message.conversation_id == conv.id,
            Message.sender_id != user_id,
        ]
        if last_read:
            unread_filter.append(Message.created_at > last_read)

        count_res = await db.execute(
            select(func.count()).select_from(Message).where(*unread_filter)
        )
        unread_count = count_res.scalar()

        if unread_count == 0:
            continue

        total_unread += unread_count

        last_msg_res = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id, Message.sender_id != user_id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_res.scalar_one_or_none()

        other_id = conv.seller_id if is_buyer else conv.buyer_id
        other_user = (await db.execute(select(User).where(User.id == other_id))).scalar_one_or_none()

        listing_title = ""
        if conv.listing_id:
            listing_res = await db.execute(
                select(Listing, Vehicle)
                .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
                .where(Listing.id == conv.listing_id)
            )
            row = listing_res.one_or_none()
            if row:
                l, v = row
                listing_title = f"{v.brand or 'Unknown'} {v.model or ''}".strip()

        if conv.is_admin_chat:
            listing_title = "Admin Support"

        notifications.append({
            "conversation_id": conv.id,
            "listing_id": conv.listing_id or "",
            "listing_title": listing_title,
            "sender_first_name": other_user.first_name if other_user else "Unknown",
            "sender_last_name": other_user.last_name if other_user else "",
            "last_message": last_msg.content if last_msg else "",
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count": unread_count,
        })

    notifications.sort(key=lambda n: n["last_message_at"] or "", reverse=True)

    return {"total_unread": total_unread, "notifications": notifications}


# Mark a conversation as read for the authenticated user.
@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not a participant")

    now = datetime.now(timezone.utc)
    if conv.buyer_id == user_id:
        conv.buyer_last_read_at = now
    else:
        conv.seller_last_read_at = now

    await db.commit()
    return {"status": "ok"}
