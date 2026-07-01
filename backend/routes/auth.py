import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from jose import jwt, JWTError

from database import get_db
from encryption import encrypt_image
from models import User
from schemas import (
    RegisterRequest, LoginRequest, UserResponse, TokenResponse,
    UpdateEmailRequest, UpdatePasswordRequest, ResubmitRegistrationRequest,
)

router = APIRouter()
security = HTTPBearer()

# Hash a plain-text password using bcrypt.
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# Verify a plain-text password against its bcrypt hash.
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# Generate a signed JWT access token with an expiration time.
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Decode and validate a JWT token, returning the authenticated user ID.
def _decode_token(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Register a new user and submit the account for admin approval.
@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not body.id_number or not body.id_number.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ID number is required",
        )

    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    existing_id = await db.execute(select(User).where(User.id_number == body.id_number.strip()))
    if existing_id.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this ID number already exists",
        )

    user = User(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        password=hash_password(body.password),
        id_number=body.id_number,
        id_card_image=encrypt_image(body.id_card_image),
        registration_status="pending",
    )
    db.add(user)
    await db.commit()
    return {
        "status": "pending",
        "message": "Your registration request has been sent for admin approval. The approval process may take up to 3 business days.",
    }


# Authenticate a user and return a JWT access token.
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.registration_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration request is still waiting for admin approval.",
        )

    if user.registration_status == "rejected":
        reason = user.blocked_reason or "No reason provided"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your registration was permanently rejected. Reason: {reason}",
        )

    if user.registration_status == "changes_requested":
        reason = user.blocked_reason or "No reason provided"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"__CHANGES_REQUESTED__|{reason}",
        )

    token = create_access_token({"sub": user.id, "email": user.email, "is_admin": user.is_admin})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )

# Extract the authenticated user's ID from the JWT token.
async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    return _decode_token(credentials)


# Retrieve the authenticated user without checking account status.
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Return the User object without checking blocked status."""
    user_id = _decode_token(credentials)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Ensure the authenticated user is approved and not blocked.
async def require_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Return the full User object; raises 403 if the account is blocked."""
    user_id = _decode_token(credentials)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.blocked:
        raise HTTPException(
            status_code=403,
            detail=user.blocked_reason or "Your account has been blocked. Contact admin.",
        )
    if user.registration_status != "approved":
        raise HTTPException(
            status_code=403,
            detail="Your account has not been approved yet.",
        )
    return user


# Ensure the authenticated user has administrator privileges.
async def require_admin(
    user: User = Depends(require_active_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# Return the authenticated user's profile information.
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(require_active_user),
):
    return current_user


# Update the authenticated user's email address.
@router.put("/email", response_model=UserResponse)
async def update_email(
    body: UpdateEmailRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user = current_user

    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    existing = await db.execute(select(User).where(User.email == body.new_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")

    user.email = body.new_email
    await db.commit()
    await db.refresh(user)
    return user


# Update the authenticated user's password.
@router.put("/password")
async def update_password(
    body: UpdatePasswordRequest,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    user = current_user

    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect current password")

    if verify_password(body.new_password, user.password):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password",
        )

    user.password = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password updated"}


# Resubmit a registration after requested changes.
@router.post("/resubmit", status_code=status.HTTP_202_ACCEPTED)
async def resubmit_registration(
    body: ResubmitRegistrationRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.registration_status != "changes_requested":
        raise HTTPException(
            status_code=400,
            detail="This account is not eligible for resubmission.",
        )

    if body.first_name:
        user.first_name = body.first_name
    if body.last_name:
        user.last_name = body.last_name
    if body.id_number:
        user.id_number = body.id_number
    if body.id_card_image:
        user.id_card_image = encrypt_image(body.id_card_image)

    user.registration_status = "pending"
    user.blocked_reason = None
    await db.commit()
    return {
        "status": "pending",
        "message": "Your updated registration has been resubmitted for admin approval.",
    }
