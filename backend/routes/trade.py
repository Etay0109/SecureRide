# backend/routes/trade.py
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from constants import ACTIVE_TRADE_STATUSES, TradeStatus
from database import get_db
from models import Trade, Listing, Vehicle, User, UserInteraction
from schemas import CreateTradeRequest, TradeResponse
from routes.auth import require_active_user
from services.listing_service import remove_listing_with_conversations

router = APIRouter()

Role = Literal["seller", "buyer", "participant"]

_ROLE_ERROR = {
    "seller": "Only the seller can perform this action",
    "buyer": "Only the buyer can perform this action",
    "participant": "Not a participant in this trade",
}


# Fetch a trade, enforcing the caller's role and the trade's allowed statuses.
async def _get_trade_or_403(
    db: AsyncSession,
    trade_id: str,
    user_id: str,
    *,
    role: Role,
    allowed_statuses: tuple[TradeStatus, ...],
) -> "Trade":
    trade = (await db.execute(select(Trade).where(Trade.id == trade_id))).scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    if role == "seller" and trade.seller_id != user_id:
        raise HTTPException(status_code=403, detail=_ROLE_ERROR["seller"])
    if role == "buyer" and trade.buyer_id != user_id:
        raise HTTPException(status_code=403, detail=_ROLE_ERROR["buyer"])
    if role == "participant" and user_id not in (trade.buyer_id, trade.seller_id):
        raise HTTPException(status_code=403, detail=_ROLE_ERROR["participant"])

    if trade.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Trade is not in a valid state for this action")
    return trade


# Convert trade objects into API responses with related user and vehicle data.
async def trades_to_responses(trades: list["Trade"], db: AsyncSession) -> list[TradeResponse]:
    if not trades:
        return []
    frame_numbers = list({t.frame_number for t in trades if t.frame_number})
    user_ids = list({t.buyer_id for t in trades} | {t.seller_id for t in trades})
    vehicles: dict = {}
    if frame_numbers:
        veh_res = await db.execute(select(Vehicle).where(Vehicle.frame_number.in_(frame_numbers)))
        vehicles = {v.frame_number: v for v in veh_res.scalars().all()}
    users_res = await db.execute(select(User).where(User.id.in_(user_ids)))
    users: dict = {u.id: u for u in users_res.scalars().all()}
    result = []
    for trade in trades:
        vehicle = vehicles.get(trade.frame_number) if trade.frame_number else None
        buyer = users.get(trade.buyer_id)
        seller = users.get(trade.seller_id)
        result.append(TradeResponse(
            id=trade.id,
            listing_id=trade.listing_id,
            buyer_id=trade.buyer_id,
            seller_id=trade.seller_id,
            frame_number=trade.frame_number or trade.vehicle_frame_number_snapshot,
            price=trade.price,
            status=trade.status,
            seller_confirmed=trade.seller_confirmed,
            buyer_confirmed=trade.buyer_confirmed,
            created_at=trade.created_at,
            completed_at=trade.completed_at,
            vehicle_brand=(vehicle.brand if vehicle else None) or trade.vehicle_brand_snapshot,
            vehicle_model=(vehicle.model if vehicle else None) or trade.vehicle_model_snapshot,
            vehicle_type=(vehicle.vehicle_type if vehicle else None) or trade.vehicle_type_snapshot,
            vehicle_color=(vehicle.color if vehicle else None) or trade.vehicle_color_snapshot,
            buyer_first_name=buyer.first_name if buyer else None,
            buyer_last_name=buyer.last_name if buyer else None,
            seller_first_name=seller.first_name if seller else None,
            seller_last_name=seller.last_name if seller else None,
        ))
    return result


# Convert a Trade database object into an API response.
async def trade_to_response(trade: Trade, db: AsyncSession) -> TradeResponse:
    return (await trades_to_responses([trade], db))[0]


# Create a new trade request for a listing.
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_trade(
    body: CreateTradeRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    listing = (await db.execute(
        select(Listing).where(Listing.id == body.listing_id)
    )).scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing")

    existing = (await db.execute(
        select(Trade).where(
            Trade.listing_id == body.listing_id,
            Trade.buyer_id == user_id,
            Trade.status.in_(ACTIVE_TRADE_STATUSES),
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active trade request for this listing")

    trade = Trade(
        listing_id=listing.id,
        buyer_id=user_id,
        seller_id=listing.seller_id,
        frame_number=listing.frame_number,
        price=listing.price,
        status=TradeStatus.PENDING_SELLER,
    )
    db.add(trade)

    db.add(UserInteraction(
        user_id=user_id,
        listing_id=listing.id,
        action_type="trade",
    ))

    await db.commit()
    await db.refresh(trade)
    return await trade_to_response(trade, db)


# Return all trades related to the authenticated user.
@router.get("/my")
async def my_trades(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Trade)
        .where(or_(Trade.buyer_id == user_id, Trade.seller_id == user_id))
        .order_by(Trade.created_at.desc())
    )
    trades = result.scalars().all()
    return await trades_to_responses(trades, db)


# Return active trades for a specific listing.
@router.get("/listing/{listing_id}")
async def trades_for_listing(
    listing_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get active trades for a specific listing (visible to both buyer and seller)."""
    user_id = current_user.id
    result = await db.execute(
        select(Trade).where(
            Trade.listing_id == listing_id,
            or_(Trade.buyer_id == user_id, Trade.seller_id == user_id),
            Trade.status.in_(ACTIVE_TRADE_STATUSES),
        )
    )
    trades = result.scalars().all()
    return await trades_to_responses(trades, db)


# Allow the seller to accept a pending trade request.
@router.put("/{trade_id}/accept")
async def accept_trade(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    trade = await _get_trade_or_403(
        db, trade_id, current_user.id,
        role="seller", allowed_statuses=(TradeStatus.PENDING_SELLER,),
    )
    trade.status = TradeStatus.ACCEPTED
    await db.commit()
    await db.refresh(trade)
    return await trade_to_response(trade, db)


# Allow the seller to reject a pending trade request.
@router.put("/{trade_id}/reject")
async def reject_trade(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    trade = await _get_trade_or_403(
        db, trade_id, current_user.id,
        role="seller", allowed_statuses=(TradeStatus.PENDING_SELLER,),
    )
    trade.status = TradeStatus.REJECTED
    await db.commit()
    await db.refresh(trade)
    return await trade_to_response(trade, db)


# Allow the buyer to cancel an active trade request.
@router.put("/{trade_id}/cancel")
async def cancel_trade(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    trade = await _get_trade_or_403(
        db, trade_id, current_user.id,
        role="buyer", allowed_statuses=ACTIVE_TRADE_STATUSES,
    )
    trade.status = TradeStatus.CANCELLED
    await db.commit()
    await db.refresh(trade)
    return await trade_to_response(trade, db)


# Allow either participant to abort an accepted trade.
@router.put("/{trade_id}/abort")
async def abort_trade(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Either party can abort an accepted trade that didn't go through."""
    trade = await _get_trade_or_403(
        db, trade_id, current_user.id,
        role="participant", allowed_statuses=(TradeStatus.ACCEPTED,),
    )
    trade.status = TradeStatus.CANCELLED
    trade.seller_confirmed = False
    trade.buyer_confirmed = False
    await db.commit()
    await db.refresh(trade)
    return await trade_to_response(trade, db)


# Reject if a trade was auto-cancelled because its vehicle was reported stolen.
async def _reject_if_cancelled_stolen(db: AsyncSession, trade_id: str) -> None:
    pre = (await db.execute(select(Trade).where(Trade.id == trade_id))).scalar_one_or_none()
    if pre and pre.status == TradeStatus.CANCELLED and pre.frame_number:
        v = (await db.execute(
            select(Vehicle).where(Vehicle.frame_number == pre.frame_number)
        )).scalar_one_or_none()
        if v and v.stolen:
            raise HTTPException(
                status_code=400,
                detail="This trade has been cancelled because the vehicle was reported as stolen.",
            )


# Reject if the vehicle behind a trade is currently reported stolen.
async def _reject_if_vehicle_stolen(db: AsyncSession, frame_number: str | None) -> None:
    if not frame_number:
        return
    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.frame_number == frame_number)
    )).scalar_one_or_none()
    if vehicle and vehicle.stolen:
        raise HTTPException(
            status_code=400,
            detail="This vehicle has been reported stolen. Trade cannot proceed.",
        )


# Shared confirmation flow for both the seller (transfer) and buyer (receipt).
async def _confirm(
    trade_id: str,
    user_id: str,
    db: AsyncSession,
    *,
    side: Literal["seller", "buyer"],
) -> TradeResponse:
    await _reject_if_cancelled_stolen(db, trade_id)
    trade = await _get_trade_or_403(
        db, trade_id, user_id,
        role=side, allowed_statuses=(TradeStatus.ACCEPTED,),
    )
    await _reject_if_vehicle_stolen(db, trade.frame_number)

    setattr(trade, f"{side}_confirmed", True)
    other = "buyer" if side == "seller" else "seller"
    if getattr(trade, f"{other}_confirmed"):
        await _complete_trade(trade, db)
    else:
        await db.commit()
        await db.refresh(trade)

    return await trade_to_response(trade, db)


# Allow the seller to confirm that the vehicle was transferred.
@router.put("/{trade_id}/confirm-transfer")
async def confirm_transfer(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Seller confirms they have transferred the vehicle."""
    return await _confirm(trade_id, current_user.id, db, side="seller")


# Allow the buyer to confirm that the vehicle was received.
@router.put("/{trade_id}/confirm-receipt")
async def confirm_receipt(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Buyer confirms they have received the vehicle."""
    return await _confirm(trade_id, current_user.id, db, side="buyer")


# Complete the trade, transfer ownership, and clean up the listing.
async def _complete_trade(trade: Trade, db: AsyncSession):
    """Transfer vehicle ownership, remove listing, mark trade completed."""
    listing_id = trade.listing_id

    trade.status = TradeStatus.COMPLETED
    trade.completed_at = datetime.now(timezone.utc)

    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.frame_number == trade.frame_number)
    )).scalar_one()
    if vehicle.stolen:
        raise HTTPException(
            status_code=400,
            detail="This vehicle has been reported stolen. Ownership transfer is blocked.",
        )
    vehicle.owner_id = trade.buyer_id
    trade.vehicle_frame_number_snapshot = vehicle.frame_number
    trade.vehicle_brand_snapshot = vehicle.brand
    trade.vehicle_model_snapshot = vehicle.model
    trade.vehicle_type_snapshot = vehicle.vehicle_type
    trade.vehicle_color_snapshot = vehicle.color

    if listing_id:
        other_trades = (await db.execute(
            select(Trade).where(
                Trade.listing_id == listing_id,
                Trade.id != trade.id,
                Trade.status.in_(ACTIVE_TRADE_STATUSES),
            )
        )).scalars().all()
        for t in other_trades:
            t.status = TradeStatus.CANCELLED
            t.listing_id = None

        trade.listing_id = None
        await remove_listing_with_conversations(db, listing_id)

    await db.commit()
    await db.refresh(trade)
