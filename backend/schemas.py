from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


_MAX_IMAGE_B64 = 14_000_000  # ~10 MB binary


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    id_number: str
    id_card_image: str

    @field_validator("id_card_image")
    @classmethod
    def id_card_image_size(cls, v: str) -> str:
        if len(v) > _MAX_IMAGE_B64:
            raise ValueError("ID card image must be under 10 MB")
        return v


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
    registration_status: str = "approved"
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyRequest(BaseModel):
    frame_number: str
    vehicle_type: str
    brand: str | None = None
    model: str | None = None
    color: str | None = None
    additional_details: str | None = None


class RejectRegistrationRequest(BaseModel):
    reason: str


class ResubmitRegistrationRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str | None = None
    last_name: str | None = None
    id_number: str | None = None
    id_card_image: str | None = None

    @field_validator("id_card_image")
    @classmethod
    def id_card_image_size(cls, v: str | None) -> str | None:
        if v is not None and len(v) > _MAX_IMAGE_B64:
            raise ValueError("ID card image must be under 10 MB")
        return v


class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    password: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


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
    price: float = Field(gt=0, le=1_000_000)
    city: str | None = None
    address: str | None = None
    description: str | None = None
    photos: list[str] = []

    @field_validator("photos")
    @classmethod
    def photos_limits(cls, v: list[str]) -> list[str]:
        if len(v) > 8:
            raise ValueError("A listing can have at most 8 photos")
        for photo in v:
            if len(photo) > _MAX_IMAGE_B64:
                raise ValueError("Each photo must be under 10 MB")
        return v


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
    price: float | None = Field(default=None, gt=0, le=1_000_000)
    city: str | None = None
    address: str | None = None
    description: str | None = None
    photos: list[str] | None = None

    @field_validator("photos")
    @classmethod
    def photos_limits(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if len(v) > 8:
            raise ValueError("A listing can have at most 8 photos")
        for photo in v:
            if len(photo) > _MAX_IMAGE_B64:
                raise ValueError("Each photo must be under 10 MB")
        return v


class CreateTradeRequest(BaseModel):
    listing_id: str


class TradeResponse(BaseModel):
    id: str
    listing_id: str | None
    buyer_id: str
    seller_id: str
    frame_number: str | None
    price: float
    status: str
    seller_confirmed: bool
    buyer_confirmed: bool
    created_at: datetime
    completed_at: datetime | None = None
    vehicle_brand: str | None = None
    vehicle_model: str | None = None
    vehicle_type: str | None = None
    vehicle_color: str | None = None
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


class TrackInteractionRequest(BaseModel):
    listing_id: str
    action_type: str


class RecommendedListingResponse(ListingResponse):
    score: float = 0.0


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
