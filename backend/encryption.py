import os
import base64

from cryptography.fernet import Fernet

_KEY_ENV = "ID_CARD_ENCRYPTION_KEY"

def _get_key() -> bytes:
    key = os.getenv(_KEY_ENV)
    if not key:
        raise RuntimeError(
            f"{_KEY_ENV} is not configured. "
            "Set it in backend/.env to keep encrypted ID card images readable."
        )
    return key.encode()


_fernet = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_key())
    return _fernet


def encrypt_image(plain_text: str) -> str:
    """Encrypt a base64 data-URL string and return a URL-safe base64 cipher text."""
    f = _get_fernet()
    return base64.urlsafe_b64encode(
        f.encrypt(plain_text.encode("utf-8"))
    ).decode("ascii")


def decrypt_image(cipher_text: str) -> str:
    """Decrypt back to the original base64 data-URL string."""
    f = _get_fernet()
    raw = base64.urlsafe_b64decode(cipher_text.encode("ascii"))
    return f.decrypt(raw).decode("utf-8")
