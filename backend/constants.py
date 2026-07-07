# backend/constants.py
from enum import StrEnum


class TradeStatus(StrEnum):
    PENDING_SELLER = "pending_seller"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class RegistrationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHANGES_REQUESTED = "changes_requested"


# Trades that still occupy a listing / block new offers.
ACTIVE_TRADE_STATUSES = (TradeStatus.PENDING_SELLER, TradeStatus.ACCEPTED)


class ConversationKind(StrEnum):
    LISTING = "listing"
    ADMIN = "admin"
