# backend/repositories/listings.py
from sqlalchemy import select

from models import Listing, Vehicle, User


# Base SELECT that joins a listing with its vehicle and seller.
# Callers append their own .where()/.order_by() clauses.
def listing_join_query():
    return (
        select(Listing, Vehicle, User)
        .join(Vehicle, Listing.frame_number == Vehicle.frame_number)
        .join(User, Listing.seller_id == User.id)
    )
