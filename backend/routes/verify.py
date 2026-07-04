import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Vehicle, User, Listing, Trade
from schemas import VerifyRequest, VehicleResponse
from routes.auth import require_active_user

router = APIRouter()


# Return all vehicles owned by the authenticated user.
@router.get("/my-vehicles", response_model=list[VehicleResponse])
async def my_vehicles(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle).where(Vehicle.owner_id == current_user.id)
    )
    return result.scalars().all()


# Toggle the stolen status of a vehicle owned by the authenticated user.
@router.put("/{frame_number}/toggle-stolen", response_model=VehicleResponse)
async def toggle_stolen(
    frame_number: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.frame_number == frame_number,
            Vehicle.owner_id == current_user.id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.stolen = not vehicle.stolen
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


# Register a new vehicle and link it to the authenticated user.
@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def verify_ownership(
    body: VerifyRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    frame_number = body.frame_number.strip()
    if not re.fullmatch(r"[A-Za-z0-9]{16,18}", frame_number):
        raise HTTPException(
            status_code=400,
            detail="Frame number must contain 16–18 letters and numbers only.",
        )

    result = await db.execute(
        select(Vehicle).where(Vehicle.frame_number == frame_number)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.stolen:
        current_user.blocked = True
        current_user.blocked_reason = (
            f"Attempted to register vehicle (frame: {body.frame_number}) "
            f"that is reported as stolen."
        )
        await db.commit()
        raise HTTPException(
            status_code=403,
            detail={"code": "account_blocked", "reason": "This vehicle is reported as stolen. Your account has been blocked pending investigation."},
        )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vehicle with this frame number is already registered",
        )

    vehicle = Vehicle(
        frame_number=frame_number,
        vehicle_type=body.vehicle_type,
        id_number=current_user.id_number,
        owner_id=current_user.id,
        brand=body.brand,
        model=body.model,
        color=body.color,
        additional_details=body.additional_details,
    )
    
    db.add(vehicle)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vehicle with this frame number is already registered",
        )

    await db.refresh(vehicle)
    return vehicle


# Deletes a user's vehicle if it is not linked to an active listing or trade.
@router.delete("/{frame_number}")
async def delete_vehicle(
    frame_number: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.frame_number == frame_number,
            Vehicle.owner_id == current_user.id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    listing_result = await db.execute(
        select(Listing).where(
            Listing.frame_number == frame_number,
            Listing.seller_id == current_user.id,
        ).limit(1)
    )
    if listing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a vehicle that has an active listing. Remove the listing first.",
        )

    trade_result = await db.execute(
        select(Trade).where(
            Trade.frame_number == frame_number,
            Trade.status.in_(["pending_seller", "accepted"]),
        ).limit(1)
    )
    if trade_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a vehicle involved in an active trade.",
        )

    await db.delete(vehicle)
    await db.commit()
    return {"status": "deleted"}
