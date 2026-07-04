import math
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import UserInteraction, Listing, Vehicle, User
from schemas import TrackInteractionRequest
from routes.auth import require_active_user
from serializers import listing_to_response

router = APIRouter()

ACTION_WEIGHTS = {"view": 0.2, "chat": 3, "trade": 5}
VEHICLE_TYPES = ["Bicycle", "Electric Scooter", "Electric Bicycle"]
CONDITIONS = ["used", "brand_new"]
PRICE_BANDS = [
    (0, 1000),
    (1000, 2500),
    (2500, 5000),
    (5000, 10000),
    (10000, float("inf")),
]

FEATURE_WEIGHTS = {
    "vehicle_type": 5.0,
    "price": 4.0,
    "city": 3.0,
    "condition": 2.0,
}

# Return the index of the price range that matches the listing price.
def _price_band_index(price: float) -> int:
    for i, (low, high) in enumerate(PRICE_BANDS):
        if low <= price < high:
            return i
    return len(PRICE_BANDS) - 1


# Convert a listing into a weighted numerical feature vector.
def _build_feature_vector(listing_row, city_index: dict[str, int], num_cities: int) -> list[float]:
    """Encode a listing into a weighted numerical feature vector.

    Each feature group is multiplied by its weight so that vehicle_type
    has the most influence, then price, city, and condition.

    Layout: [type one-hot (3)] + [condition one-hot (2)] + [price band one-hot (5)] + [city one-hot (N)]
    """
    listing, vehicle, _seller = listing_row

    w_type = FEATURE_WEIGHTS["vehicle_type"]
    w_cond = FEATURE_WEIGHTS["condition"]
    w_price = FEATURE_WEIGHTS["price"]
    w_city = FEATURE_WEIGHTS["city"]

    type_vec = [w_type * (1.0 if vehicle.vehicle_type == t else 0.0) for t in VEHICLE_TYPES]
    cond_vec = [w_cond * (1.0 if listing.condition == c else 0.0) for c in CONDITIONS]

    band = _price_band_index(listing.price)
    price_vec = [w_price * (1.0 if i == band else 0.0) for i in range(len(PRICE_BANDS))]

    city_vec = [0.0] * num_cities
    city = (listing.city or "").strip().lower()
    if city in city_index:
        city_vec[city_index[city]] = w_city

    return type_vec + cond_vec + price_vec + city_vec


# Compare two feature vectors and return how similar they are.
def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# Compute the weighted average vector that represents user preferences.
def _weighted_average_vector(vectors_with_weights: list[tuple[list[float], float]]) -> list[float]:
    """Compute a weighted average of feature vectors."""
    if not vectors_with_weights:
        return []
    dim = len(vectors_with_weights[0][0])
    result = [0.0] * dim
    total_weight = 0.0
    for vec, w in vectors_with_weights:
        for i in range(dim):
            result[i] += vec[i] * w
        total_weight += w
    if total_weight > 0:
        result = [x / total_weight for x in result]
    return result



# Delete all recommendation interactions for the authenticated user.
@router.delete("/reset")
async def reset_interactions(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        sa_delete(UserInteraction).where(UserInteraction.user_id == current_user.id)
    )
    await db.commit()
    return {"status": "cleared"}


# Track a user interaction with a listing.
@router.post("/track", status_code=201)
async def track_interaction(
    body: TrackInteractionRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    if body.action_type not in ACTION_WEIGHTS:
        raise HTTPException(status_code=400, detail="action_type must be view, chat, or trade")

    interaction = UserInteraction(
        user_id=current_user.id,
        listing_id=body.listing_id,
        action_type=body.action_type,
    )
    db.add(interaction)
    await db.commit()
    return {"status": "tracked"}


# Generate personalized listing recommendations for the authenticated user.
@router.get("/")
async def get_recommendations(
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=6, ge=1, le=20),
):
    user_id = current_user.id

    # 1. Fetch all available listings (non-stolen, not user's own)
    all_rows_result = await db.execute(
        select(Listing, Vehicle, User)
        .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
        .join(User, Listing.seller_id == User.id)
        .where(Vehicle.stolen == False, Listing.seller_id != user_id) 
    )
    all_rows = all_rows_result.all()

    if not all_rows:
        return []

    # 2. Build city index for one-hot encoding
    cities = sorted({
        (row[0].city or "").strip().lower()
        for row in all_rows
        if (row[0].city or "").strip()
    })
    city_index = {city: i for i, city in enumerate(cities)}
    num_cities = len(cities)

    # 3. Build feature vectors for every listing
    listing_vectors: dict[str, list[float]] = {}
    listing_data: dict[str, tuple] = {}
    for row in all_rows:
        listing, vehicle, seller = row
        vec = _build_feature_vector(row, city_index, num_cities)
        listing_vectors[listing.id] = vec
        listing_data[listing.id] = (listing, vehicle, seller)

    # 4. Fetch user's interactions
    interactions_result = await db.execute(
        select(UserInteraction).where(UserInteraction.user_id == user_id)
    )
    interactions = interactions_result.scalars().all()

    # 5. Cold start: no interactions -> return most-viewed listings (popularity)
    if not interactions:
        popularity = await db.execute(
            select(UserInteraction.listing_id, func.count().label("cnt"))
            .where(UserInteraction.action_type == "view")
            .group_by(UserInteraction.listing_id)
        )
        pop_counts = {row.listing_id: row.cnt for row in popularity.all()}

        scored = []
        for lid, (listing, vehicle, seller) in listing_data.items():
            pop_score = pop_counts.get(lid, 0)
            scored.append((pop_score, listing, vehicle, seller))
        scored.sort(key=lambda x: x[0], reverse=True)

        return [
            listing_to_response(listing, vehicle, seller, score=0.0)
            for _, listing, vehicle, seller in scored[:limit]
        ]

    # 6. Aggregate interaction weights per listing (take the highest action per listing)
    listing_max_weight: dict[str, float] = defaultdict(float)
    for inter in interactions:
        w = ACTION_WEIGHTS.get(inter.action_type, 0)
        if w > listing_max_weight[inter.listing_id]:
            listing_max_weight[inter.listing_id] = w

    # 7. Build user preference vector from interacted listings
    vectors_with_weights = []
    for lid, weight in listing_max_weight.items():
        if lid in listing_vectors:
            vectors_with_weights.append((listing_vectors[lid], weight))

    if not vectors_with_weights:
        results = []
        for row in all_rows[:limit]:
            listing, vehicle, seller = row
            results.append(listing_to_response(listing, vehicle, seller, score=0.0))
        return results

    user_vector = _weighted_average_vector(vectors_with_weights)

    # 8. Score each candidate listing by cosine similarity
    scored_listings = []
    for lid, vec in listing_vectors.items():
        score = _cosine_similarity(user_vector, vec)
        listing, vehicle, seller = listing_data[lid]
        scored_listings.append((score, listing, vehicle, seller))

    scored_listings.sort(key=lambda x: x[0], reverse=True)

    return [
        listing_to_response(listing, vehicle, seller, score=score)
        for score, listing, vehicle, seller in scored_listings[:limit]
    ]
