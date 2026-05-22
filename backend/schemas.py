from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    id_number: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    id_number: str = ""
    is_admin: bool = False
    blocked: bool = False
    blocked_reason: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyRequest(BaseModel):
    frame_number: str
    vehicle_type: str
    id_number: str
    brand: str | None = None
    model: str | None = None
    color: str | None = None
    additional_details: str | None = None


class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    password: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class VehicleResponse(BaseModel):
    frame_number: str
    vehicle_type: str
    id_number: str
    owner_id: str
    brand: str | None
    model: str | None
    color: str | None
    additional_details: str | None
    stolen: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateListingRequest(BaseModel):
    frame_number: str
    condition: str
    ownership_duration: str
    price: float
    city: str | None = None
    address: str | None = None
    description: str | None = None
    photos: list[str] = []


class ListingResponse(BaseModel):
    id: str
    frame_number: str
    seller_id: str
    condition: str
    ownership_duration: str
    price: float
    description: str | None
    photos: list[str]
    created_at: datetime
    vehicle_brand: str | None = None
    vehicle_model: str | None = None
    vehicle_type: str | None = None
    vehicle_color: str | None = None
    city: str | None = None
    address: str | None = None
    seller_first_name: str | None = None
    seller_last_name: str | None = None


class UpdateListingRequest(BaseModel):
    condition: str | None = None
    ownership_duration: str | None = None
    price: float | None = None
    city: str | None = None
    address: str | None = None
    description: str | None = None
    photos: list[str] | None = None


class CreateTradeRequest(BaseModel):
    listing_id: str


class TradeResponse(BaseModel):
    id: str
    listing_id: str | None
    buyer_id: str
    seller_id: str
    frame_number: str
    price: float
    status: str
    seller_confirmed: bool
    buyer_confirmed: bool
    created_at: datetime
    completed_at: datetime | None = None
    vehicle_brand: str | None = None
    vehicle_model: str | None = None
    vehicle_type: str | None = None
    buyer_first_name: str | None = None
    buyer_last_name: str | None = None
    seller_first_name: str | None = None
    seller_last_name: str | None = None


class StartConversationRequest(BaseModel):
    listing_id: str


class SendMessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    seller_id: str
    created_at: datetime
    other_user_first_name: str | None = None
    other_user_last_name: str | None = None
    listing_title: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
