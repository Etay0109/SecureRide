import json

from models import Listing, Vehicle, User
from schemas import ListingResponse, RecommendedListingResponse


# Decode the JSON-encoded photo column into a list of photo URLs.
def load_photos(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []


# Convert database models into a listing API response.
def listing_to_response(
    listing: Listing,
    vehicle: Vehicle,
    seller: User | None = None,
    score: float | None = None,
    thumbnail_only: bool = False,
) -> ListingResponse | RecommendedListingResponse:
    photos = load_photos(listing.photos)

    # List/grid views only render a single cover image.
    if thumbnail_only:
        photos = photos[:1]

    data = dict(
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
    if score is not None:
        return RecommendedListingResponse(**data, score=round(score, 4))
    return ListingResponse(**data)
