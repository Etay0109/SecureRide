# backend/services/listing_service.py
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from models import Listing, Conversation, Message


# Remove a listing along with its conversations and their messages.
# Does not commit; the caller owns the transaction boundary.
async def remove_listing_with_conversations(db: AsyncSession, listing_id: str) -> None:
    conv_ids = (await db.execute(
        select(Conversation.id).where(Conversation.listing_id == listing_id)
    )).scalars().all()
    if conv_ids:
        await db.execute(sa_delete(Message).where(Message.conversation_id.in_(conv_ids)))
        await db.execute(sa_delete(Conversation).where(Conversation.id.in_(conv_ids)))

    await db.execute(sa_delete(Listing).where(Listing.id == listing_id))
