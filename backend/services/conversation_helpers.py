# backend/services/conversation_helpers.py
from datetime import datetime, timezone

from sqlalchemy import or_

from constants import ConversationKind
from models import Conversation


def other_participant_id(conv: Conversation, user_id: str) -> str:
    if user_id == conv.participant_a_id:
        return conv.participant_b_id
    return conv.participant_a_id


def hydrate_other_ids(convs, user_id: str) -> list[str]:
    return list({other_participant_id(c, user_id) for c in convs})


def is_participant(conv: Conversation, user_id: str) -> bool:
    return user_id in (conv.participant_a_id, conv.participant_b_id)


def participant_filter(user_id: str):
    return or_(
        Conversation.participant_a_id == user_id,
        Conversation.participant_b_id == user_id,
    )


def get_last_read_at(conv: Conversation, user_id: str):
    if user_id == conv.participant_a_id:
        return conv.participant_a_last_read_at or conv.buyer_last_read_at
    if user_id == conv.participant_b_id:
        return conv.participant_b_last_read_at or conv.seller_last_read_at
    return None


def set_last_read_at(conv: Conversation, user_id: str, ts: datetime | None = None) -> None:
    ts = ts or datetime.now(timezone.utc)
    if user_id == conv.participant_a_id:
        conv.participant_a_last_read_at = ts
        conv.buyer_last_read_at = ts
    elif user_id == conv.participant_b_id:
        conv.participant_b_last_read_at = ts
        conv.seller_last_read_at = ts


def listing_conversation(*, listing_id: str, buyer_id: str, seller_id: str) -> Conversation:
    return Conversation(
        kind=ConversationKind.LISTING,
        listing_id=listing_id,
        participant_a_id=buyer_id,
        participant_b_id=seller_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        is_admin_chat=False,
    )


def admin_conversation(*, user_id: str, admin_id: str) -> Conversation:
    return Conversation(
        kind=ConversationKind.ADMIN,
        listing_id=None,
        participant_a_id=user_id,
        participant_b_id=admin_id,
        buyer_id=user_id,
        seller_id=admin_id,
        is_admin_chat=True,
    )


def admin_conversation_filter(admin_id: str, user_id: str):
    return (
        Conversation.kind == ConversationKind.ADMIN,
        or_(
            (Conversation.participant_a_id == user_id) & (Conversation.participant_b_id == admin_id),
            (Conversation.participant_a_id == admin_id) & (Conversation.participant_b_id == user_id),
        ),
    )
