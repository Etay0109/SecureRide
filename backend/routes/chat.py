# backend/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from constants import ConversationKind
from database import get_db
from models import Conversation, Message, Listing, User, Vehicle, UserInteraction
from schemas import (
    StartConversationRequest, SendMessageRequest,
    MessageResponse, ConversationResponse,
    ConversationDetailResponse, UnreadNotification, UnreadResponse,
)
from routes.auth import require_active_user, require_auth
from services.conversation_helpers import (
    get_last_read_at,
    hydrate_other_ids,
    is_participant,
    listing_conversation,
    other_participant_id,
    participant_filter,
    set_last_read_at,
)

router = APIRouter()


# Human-readable title for a listing's vehicle (e.g. "Trek Marlin").
def listing_title(vehicle: Vehicle) -> str:
    return f"{vehicle.brand or 'Unknown'} {vehicle.model or ''}".strip()


# The display title for a conversation, resolving admin chats and listing names.
def _display_title(conv: Conversation, listing_titles: dict[str, str]) -> str:
    if conv.kind == ConversationKind.ADMIN:
        return "Admin Support"
    return listing_titles.get(conv.listing_id, "") if conv.listing_id else ""


# Batch-load the "other participant" users and listing titles for a set of
# conversations. Shared by the list and unread-notification endpoints.
async def hydrate_conversations(
    convs, user_id: str, db: AsyncSession
) -> tuple[dict[str, User], dict[str, str]]:
    other_ids = hydrate_other_ids(convs, user_id)
    other_users: dict[str, User] = {}
    if other_ids:
        res = await db.execute(select(User).where(User.id.in_(other_ids)))
        other_users = {u.id: u for u in res.scalars().all()}

    listing_ids = list({c.listing_id for c in convs if c.listing_id})
    listing_titles: dict[str, str] = {}
    if listing_ids:
        lr = await db.execute(
            select(Listing, Vehicle)
            .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
            .where(Listing.id.in_(listing_ids))
        )
        for listing, vehicle in lr.all():
            listing_titles[listing.id] = listing_title(vehicle)
    return other_users, listing_titles


# Fetch a conversation and ensure the user is a participant.
async def get_conversation_or_403(
    conversation_id: str, user_id: str, db: AsyncSession
) -> Conversation:
    conv = (await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not is_participant(conv, user_id):
        raise HTTPException(status_code=403, detail="Not a participant")
    return conv


# Build the conversation title and listing price for display.
async def _conversation_title(conv, db: AsyncSession) -> tuple[str, float]:
    title = ""
    listing_price = 0.0
    if conv.listing_id:
        listing_res = await db.execute(
            select(Listing, Vehicle)
            .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
            .where(Listing.id == conv.listing_id)
        )
        row = listing_res.one_or_none()
        if row:
            listing, vehicle = row
            title = listing_title(vehicle)
            listing_price = listing.price
    if conv.kind == ConversationKind.ADMIN:
        title = "Admin Support"
    return title, listing_price


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
            Conversation.kind == ConversationKind.LISTING,
            Conversation.listing_id == body.listing_id,
            Conversation.participant_a_id == user_id,
        )
    )
    conv = existing.scalar_one_or_none()
    if conv:
        return {"id": conv.id}

    conv = listing_conversation(
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
@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    last_at_subq = (
        select(
            Message.conversation_id,
            func.max(Message.created_at).label("last_at"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    result = await db.execute(
        select(Conversation)
        .where(participant_filter(user_id))
        .outerjoin(last_at_subq, Conversation.id == last_at_subq.c.conversation_id)
        .order_by(func.coalesce(last_at_subq.c.last_at, Conversation.created_at).desc())
    )
    conversations = result.scalars().all()

    if not conversations:
        return []

    conv_ids = [c.id for c in conversations]

    other_users, listing_titles = await hydrate_conversations(conversations, user_id, db)

    last_msgs_res = await db.execute(
        select(Message).join(
            last_at_subq,
            (Message.conversation_id == last_at_subq.c.conversation_id)
            & (Message.created_at == last_at_subq.c.last_at),
        ).where(Message.conversation_id.in_(conv_ids))
    )
    last_msgs: dict[str, Message] = {}
    for m in last_msgs_res.scalars().all():
        if m.conversation_id not in last_msgs:
            last_msgs[m.conversation_id] = m

    responses = []
    for conv in conversations:
        other_id = other_participant_id(conv, user_id)
        other_user = other_users.get(other_id)
        last_msg = last_msgs.get(conv.id)
        responses.append(ConversationResponse(
            id=conv.id,
            listing_id=conv.listing_id,
            buyer_id=conv.buyer_id,
            seller_id=conv.seller_id,
            created_at=conv.created_at,
            other_user_first_name=other_user.first_name if other_user else None,
            other_user_last_name=other_user.last_name if other_user else None,
            listing_title=_display_title(conv, listing_titles),
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
        ))

    return responses


# Return details for a specific conversation.
@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    conv = await get_conversation_or_403(conversation_id, current_user.id, db)

    other_id = other_participant_id(conv, current_user.id)
    other_user = (await db.execute(select(User).where(User.id == other_id))).scalar_one_or_none()

    title, listing_price = await _conversation_title(conv, db)

    return ConversationDetailResponse(
        id=conv.id,
        listing_id=conv.listing_id,
        kind=conv.kind,
        participant_a_id=conv.participant_a_id,
        participant_b_id=conv.participant_b_id,
        buyer_id=conv.buyer_id,
        seller_id=conv.seller_id,
        other_user_first_name=other_user.first_name if other_user else None,
        other_user_last_name=other_user.last_name if other_user else None,
        listing_title=title,
        listing_price=listing_price,
        is_admin_chat=conv.kind == ConversationKind.ADMIN,
    )


# Return all messages for a conversation.
@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    await get_conversation_or_403(conversation_id, current_user.id, db)

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return [MessageResponse.model_validate(m) for m in result.scalars().all()]


# Send a new message in a conversation.
@router.post("/conversations/{conversation_id}/messages", status_code=201, response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    await get_conversation_or_403(conversation_id, current_user.id, db)

    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
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
    await get_conversation_or_403(conversation_id, current_user.id, db)

    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()
    return {"status": "deleted"}


# Return unread message notifications for the authenticated user.
@router.get("/unread", response_model=UnreadResponse)
async def get_unread_notifications(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    convs_result = await db.execute(
        select(Conversation).where(participant_filter(user_id))
    )
    conversations = convs_result.scalars().all()

    if not conversations:
        return UnreadResponse()

    conv_ids = [c.id for c in conversations]

    msgs_res = await db.execute(
        select(Message)
        .where(Message.conversation_id.in_(conv_ids), Message.sender_id != user_id)
        .order_by(Message.created_at.asc())
    )
    msgs_by_conv: dict[str, list] = {}
    for m in msgs_res.scalars().all():
        msgs_by_conv.setdefault(m.conversation_id, []).append(m)

    unread_convs: list[tuple] = []
    for conv in conversations:
        last_read = get_last_read_at(conv, user_id)
        conv_msgs = msgs_by_conv.get(conv.id, [])
        unread = [m for m in conv_msgs if last_read is None or m.created_at > last_read]
        if unread:
            last_msg = conv_msgs[-1]
            unread_convs.append((conv, len(unread), last_msg))

    if not unread_convs:
        return UnreadResponse()

    other_users, listing_titles = await hydrate_conversations(
        [c for c, _, _ in unread_convs], user_id, db
    )

    unread_convs.sort(key=lambda t: t[2].created_at, reverse=True)

    notifications = []
    total_unread = 0
    for conv, unread_count, last_msg in unread_convs:
        total_unread += unread_count
        other_id = other_participant_id(conv, user_id)
        other_user = other_users.get(other_id)
        notifications.append(UnreadNotification(
            conversation_id=conv.id,
            listing_id=conv.listing_id,
            listing_title=_display_title(conv, listing_titles),
            sender_first_name=other_user.first_name if other_user else "Unknown",
            sender_last_name=other_user.last_name if other_user else "",
            last_message=last_msg.content,
            last_message_at=last_msg.created_at,
            unread_count=unread_count,
        ))

    return UnreadResponse(total_unread=total_unread, notifications=notifications)


# Mark a conversation as read for the authenticated user.
@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    conv = await get_conversation_or_403(conversation_id, current_user.id, db)
    set_last_read_at(conv, current_user.id)
    await db.commit()
    return {"status": "ok"}
