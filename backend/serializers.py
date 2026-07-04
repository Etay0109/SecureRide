import json

from models import Listing, Vehicle, User
from schemas import ListingResponse, RecommendedListingResponse


# Convert database models into a listing API response.
def listing_to_response(
    listing: Listing,
    vehicle: Vehicle,
    seller: User | None = None,
    score: float | None = None,
) -> ListingResponse | RecommendedListingResponse:
    photos = []
    if listing.photos:
        try:
            photos = json.loads(listing.photos)
        except (json.JSONDecodeError, TypeError):
            photos = []

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
