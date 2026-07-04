from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Trade, Listing, Vehicle, User, Conversation, Message, UserInteraction
from schemas import CreateTradeRequest, TradeResponse
from routes.auth import require_active_user

router = APIRouter()

# Helper function to get a trade and check user access and trade status.
async def _get_trade_or_403(
    db: AsyncSession,
    trade_id: str,
    user_id: str,
    *,
    role: str | None = None,
    allowed_statuses: str | list[str],
    role_error: str,
    status_error: str,
) -> "Trade":
    trade = (await db.execute(select(Trade).where(Trade.id == trade_id))).scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if role == "seller":
        if trade.seller_id != user_id:
            raise HTTPException(status_code=403, detail=role_error)
    elif role == "buyer":
        if trade.buyer_id != user_id:
            raise HTTPException(status_code=403, detail=role_error)
    else:
        if trade.buyer_id != user_id and trade.seller_id != user_id:
            raise HTTPException(status_code=403, detail=role_error)
    if isinstance(allowed_statuses, str):
        if trade.status != allowed_statuses:
            raise HTTPException(status_code=400, detail=status_error)
    else:
        if trade.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail=status_error)
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
            Trade.status.in_(["pending_seller", "accepted"]),
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
        status="pending_seller",
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
            Trade.status.in_(["pending_seller", "accepted"]),
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
    user_id = current_user.id
    trade = await _get_trade_or_403(db, trade_id, user_id, role="seller", allowed_statuses="pending_seller", role_error="Only the seller can accept", status_error="Trade is not in pending state")

    trade.status = "accepted"
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
    user_id = current_user.id
    trade = await _get_trade_or_403(db, trade_id, user_id, role="seller", allowed_statuses="pending_seller", role_error="Only the seller can reject", status_error="Trade is not in pending state")

    trade.status = "rejected"
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
    user_id = current_user.id
    trade = await _get_trade_or_403(db, trade_id, user_id, role="buyer", allowed_statuses=["pending_seller", "accepted"], role_error="Only the buyer can cancel", status_error="Trade cannot be cancelled in current state")

    trade.status = "cancelled"
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
    user_id = current_user.id
    trade = await _get_trade_or_403(db, trade_id, user_id, role=None, allowed_statuses="accepted", role_error="Not a participant in this trade", status_error="Only accepted trades can be aborted")

    trade.status = "cancelled"
    trade.seller_confirmed = False
    trade.buyer_confirmed = False
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
    user_id = current_user.id
    pre = (await db.execute(select(Trade).where(Trade.id == trade_id))).scalar_one_or_none()
    if pre and pre.status == "cancelled" and pre.frame_number:
        v = (await db.execute(
            select(Vehicle).where(Vehicle.frame_number == pre.frame_number)
        )).scalar_one_or_none()
        if v and v.stolen:
            raise HTTPException(
                status_code=400,
                detail="This trade has been cancelled because the vehicle was reported as stolen.",
            )
    trade = await _get_trade_or_403(db, trade_id, user_id, role="seller", allowed_statuses="accepted", role_error="Only the seller can confirm transfer", status_error="Trade must be accepted first")

    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.frame_number == trade.frame_number)
    )).scalar_one_or_none()
    if vehicle and vehicle.stolen:
        raise HTTPException(
            status_code=400,
            detail="This vehicle has been reported stolen. Trade cannot proceed.",
        )

    trade.seller_confirmed = True
    if trade.buyer_confirmed:
        await _complete_trade(trade, db)
    else:
        await db.commit()
        await db.refresh(trade)

    return await trade_to_response(trade, db)


# Allow the buyer to confirm that the vehicle was received.
@router.put("/{trade_id}/confirm-receipt")
async def confirm_receipt(
    trade_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Buyer confirms they have received the vehicle."""
    user_id = current_user.id
    pre = (await db.execute(select(Trade).where(Trade.id == trade_id))).scalar_one_or_none()
    if pre and pre.status == "cancelled" and pre.frame_number:
        v = (await db.execute(
            select(Vehicle).where(Vehicle.frame_number == pre.frame_number)
        )).scalar_one_or_none()
        if v and v.stolen:
            raise HTTPException(
                status_code=400,
                detail="This trade has been cancelled because the vehicle was reported as stolen.",
            )
    trade = await _get_trade_or_403(db, trade_id, user_id, role="buyer", allowed_statuses="accepted", role_error="Only the buyer can confirm receipt", status_error="Trade must be accepted first")

    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.frame_number == trade.frame_number)
    )).scalar_one_or_none()
    if vehicle and vehicle.stolen:
        raise HTTPException(
            status_code=400,
            detail="This vehicle has been reported stolen. Trade cannot proceed.",
        )

    trade.buyer_confirmed = True
    if trade.seller_confirmed:
        await _complete_trade(trade, db)
    else:
        await db.commit()
        await db.refresh(trade)

    return await trade_to_response(trade, db)


# Complete the trade, transfer ownership, and clean up the listing.
async def _complete_trade(trade: Trade, db: AsyncSession):
    """Transfer vehicle ownership, remove listing, mark trade completed."""
    listing_id = trade.listing_id

    trade.status = "completed"
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
        conv_ids = (await db.execute(
            select(Conversation.id).where(Conversation.listing_id == listing_id)
        )).scalars().all()
        if conv_ids:
            await db.execute(sa_delete(Message).where(Message.conversation_id.in_(conv_ids)))
            await db.execute(sa_delete(Conversation).where(Conversation.id.in_(conv_ids)))

        other_trades = (await db.execute(
            select(Trade).where(
                Trade.listing_id == listing_id,
                Trade.id != trade.id,
                Trade.status.in_(["pending_seller", "accepted"]),
            )
        )).scalars().all()
        for t in other_trades:
            t.status = "cancelled"
            t.listing_id = None

        trade.listing_id = None
        await db.execute(sa_delete(Listing).where(Listing.id == listing_id))

    await db.commit()
    await db.refresh(trade)
