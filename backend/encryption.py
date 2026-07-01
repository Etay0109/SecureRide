import os
import base64

from cryptography.fernet import Fernet

_KEY_ENV = "ID_CARD_ENCRYPTION_KEY"

# Load the encryption key from the environment variables.
def _get_key() -> bytes:
    key = os.getenv(_KEY_ENV)
    if not key:
        raise RuntimeError(
            f"{_KEY_ENV} is not configured. "
            "Set it in backend/.env to keep encrypted ID card images readable."
        )
    return key.encode()


_fernet = None

# Create or return the shared Fernet encryption instance.
def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_key())
    return _fernet


# Encrypt an ID card image before storing it in the database.
def encrypt_image(plain_text: str) -> str:
    """Encrypt a base64 data-URL string and return a URL-safe base64 cipher text."""
    f = _get_fernet()
    return base64.urlsafe_b64encode(
        f.encrypt(plain_text.encode("utf-8"))
    ).decode("ascii")


# Decrypt an ID card image for authorized viewing.
def decrypt_image(cipher_text: str) -> str:
    """Decrypt back to the original base64 data-URL string."""
    f = _get_fernet()
    raw = base64.urlsafe_b64decode(cipher_text.encode("ascii"))
    return f.decrypt(raw).decode("utf-8")
