import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Listing, Vehicle, User
from schemas import CreateListingRequest, UpdateListingRequest
from routes.auth import require_active_user
from repositories.listings import listing_join_query
from serializers import listing_to_response, load_photos
from services.listing_service import remove_listing_with_conversations
from storage import persist_photos, delete_public_file

router = APIRouter()


# Create a new listing for one of the user's verified vehicles.
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

    existing_listing = (await db.execute(
        select(Listing).where(Listing.frame_number == body.frame_number)
    )).scalar_one_or_none()
    if existing_listing:
        raise HTTPException(status_code=400, detail="This vehicle already has an active listing")

    listing = Listing(
        frame_number=body.frame_number,
        seller_id=user_id,
        condition=body.condition,
        ownership_duration=body.ownership_duration,
        price=body.price,
        city=body.city,
        address=body.address,
        description=body.description,
        photos=json.dumps(persist_photos(body.photos)) if body.photos else None,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing_to_response(listing, vehicle)


# Return the user's verified vehicles that are available for listing.
@router.get("/available-vehicles")
async def available_vehicles(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's vehicles that are not stolen and don't have an active listing."""
    listed_frames_q = select(Listing.frame_number).where(Listing.seller_id == current_user.id)
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.owner_id == current_user.id,
            Vehicle.stolen == False,  # noqa: E712
            Vehicle.frame_number.notin_(listed_frames_q),
        )
    )
    return result.scalars().all()


# Return all active marketplace listings.
@router.get("/listings")
async def all_listings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        listing_join_query()
        .where(Vehicle.stolen == False)  # noqa: E712
        .order_by(Listing.created_at.desc())
    )
    rows = result.all()
    return [listing_to_response(listing, vehicle, seller, thumbnail_only=True) for listing, vehicle, seller in rows]


# Return details for a specific listing.
@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        listing_join_query().where(Listing.id == listing_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing, vehicle, seller = row
    return listing_to_response(listing, vehicle, seller)


# Return all listings created by the authenticated user.
@router.get("/my-listings")
async def my_listings(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        listing_join_query()
        .where(Listing.seller_id == user_id)
        .order_by(Listing.created_at.desc())
    )
    rows = result.all()
    return [listing_to_response(listing, vehicle, seller, thumbnail_only=True) for listing, vehicle, seller in rows]


# Update an existing listing owned by the authenticated user.
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
        old_photos = load_photos(listing.photos)
        new_photos = persist_photos(body.photos)
        for orphan in set(old_photos) - set(new_photos):
            delete_public_file(orphan)
        listing.photos = json.dumps(new_photos) if new_photos else None

    await db.commit()
    await db.refresh(listing)

    v_result = await db.execute(select(Vehicle).where(Vehicle.frame_number == listing.frame_number))
    vehicle = v_result.scalar_one()
    u_result = await db.execute(select(User).where(User.id == listing.seller_id))
    seller = u_result.scalar_one()
    return listing_to_response(listing, vehicle, seller)


# Delete a listing owned by the authenticated user.
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

    for url in load_photos(listing.photos):
        delete_public_file(url)

    await remove_listing_with_conversations(db, listing_id)
    await db.commit()
    return {"status": "deleted"}
