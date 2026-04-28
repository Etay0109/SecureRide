import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Listing, Vehicle, User, Conversation, Message
from schemas import CreateListingRequest, UpdateListingRequest, ListingResponse
from routes.auth import require_active_user

router = APIRouter()


def listing_to_response(listing: Listing, vehicle: Vehicle, seller: User | None = None) -> ListingResponse:
    photos = []
    if listing.photos:
        try:
            photos = json.loads(listing.photos)
        except (json.JSONDecodeError, TypeError):
            photos = []

    return ListingResponse(
        id=listing.id,
        frame_number=listing.frame_number,
        seller_id=listing.seller_id,
        condition=listing.condition,
        ownership_duration=listing.ownership_duration,
        price=listing.price,
        city=listing.city,
        address=listing.address,
        description=listing.description,
        photos=photos,
        created_at=listing.created_at,
        vehicle_brand=vehicle.brand,
        vehicle_model=vehicle.model,
        vehicle_type=vehicle.vehicle_type,
        vehicle_color=vehicle.color,
        seller_first_name=seller.first_name if seller else None,
        seller_last_name=seller.last_name if seller else None,
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: CreateListingRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.frame_number == body.frame_number,
            Vehicle.owner_id == user_id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or not owned by you")

    if vehicle.stolen:
        raise HTTPException(status_code=400, detail="Cannot sell a vehicle reported as stolen")

    listing = Listing(
        frame_number=body.frame_number,
        seller_id=user_id,
        condition=body.condition,
        ownership_duration=body.ownership_duration,
        price=body.price,
        city=body.city,
        address=body.address,
        description=body.description,
        photos=json.dumps(body.photos) if body.photos else None,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing_to_response(listing, vehicle)


@router.get("/listings")
async def all_listings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Listing, Vehicle, User)
        .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
        .join(User, Listing.seller_id == User.id)
        .where(Vehicle.stolen == False)  # noqa: E712
        .order_by(Listing.created_at.desc())
    )
    rows = result.all()
    return [listing_to_response(listing, vehicle, seller) for listing, vehicle, seller in rows]


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Listing, Vehicle, User)
        .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
        .join(User, Listing.seller_id == User.id)
        .where(Listing.id == listing_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing, vehicle, seller = row
    return listing_to_response(listing, vehicle, seller)


@router.get("/my-listings")
async def my_listings(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Listing, Vehicle, User)
        .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
        .join(User, Listing.seller_id == User.id)
        .where(Listing.seller_id == user_id)
        .order_by(Listing.created_at.desc())
    )
    rows = result.all()
    return [listing_to_response(listing, vehicle, seller) for listing, vehicle, seller in rows]


@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: str,
    body: UpdateListingRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if body.condition is not None:
        listing.condition = body.condition
    if body.ownership_duration is not None:
        listing.ownership_duration = body.ownership_duration
    if body.price is not None:
        listing.price = body.price
    if body.city is not None:
        listing.city = body.city
    if body.address is not None:
        listing.address = body.address
    if body.description is not None:
        listing.description = body.description
    if body.photos is not None:
        listing.photos = json.dumps(body.photos) if body.photos else None

    await db.commit()
    await db.refresh(listing)

    v_result = await db.execute(select(Vehicle).where(Vehicle.frame_number == listing.frame_number))
    vehicle = v_result.scalar_one()
    u_result = await db.execute(select(User).where(User.id == listing.seller_id))
    seller = u_result.scalar_one()
    return listing_to_response(listing, vehicle, seller)


@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not your listing")

    convs = await db.execute(select(Conversation).where(Conversation.listing_id == listing_id))
    for conv in convs.scalars().all():
        await db.execute(sa_delete(Message).where(Message.conversation_id == conv.id))
        await db.execute(sa_delete(Conversation).where(Conversation.id == conv.id))

    await db.execute(sa_delete(Listing).where(Listing.id == listing_id))
    await db.commit()
    return {"status": "deleted"}
