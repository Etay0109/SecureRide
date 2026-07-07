# backend/storage.py
import base64
import os
import re
import uuid
from pathlib import Path

from encryption import decrypt_image, encrypt_image

_BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", str(_BACKEND_DIR / "uploads")))
# Served behind the /api prefix so the frontend dev proxy forwards it too.
PUBLIC_PREFIX = "/api/uploads"
ID_CARD_SUBDIR = "id-cards"

_DATA_URL_RE = re.compile(r"^data:(?P<mime>[\w/+.-]+);base64,(?P<data>.+)$", re.DOTALL)
_EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _ensure_dir(subdir: str) -> Path:
    target = UPLOAD_ROOT / subdir
    target.mkdir(parents=True, exist_ok=True)
    return target


# Persist a base64 data URL to disk and return its public URL. Strings that are
# already stored URLs/paths (not data URLs) are returned unchanged.
def save_data_url(value: str, subdir: str = "listings") -> str:
    match = _DATA_URL_RE.match(value or "")
    if not match:
        return value
    ext = _EXT_BY_MIME.get(match.group("mime").lower(), ".jpg")
    raw = base64.b64decode(match.group("data"))
    name = f"{uuid.uuid4().hex}{ext}"
    (_ensure_dir(subdir) / name).write_bytes(raw)
    return f"{PUBLIC_PREFIX}/{subdir}/{name}"


# Convert a list of photo strings, saving any inline base64 data URLs to disk.
def persist_photos(photos: list[str], subdir: str = "listings") -> list[str]:
    return [save_data_url(p, subdir) for p in photos]


# Delete a previously stored public file (best-effort; ignores external URLs).
def delete_public_file(url: str) -> None:
    prefix = PUBLIC_PREFIX + "/"
    if not url or not url.startswith(prefix):
        return
    path = (UPLOAD_ROOT / url[len(prefix):]).resolve()
    try:
        if UPLOAD_ROOT.resolve() in path.parents and path.is_file():
            path.unlink()
    except OSError:
        pass


def _id_card_path(stored: str) -> Path | None:
    if not stored or not stored.startswith(f"{ID_CARD_SUBDIR}/"):
        return None
    path = (UPLOAD_ROOT / stored).resolve()
    if UPLOAD_ROOT.resolve() not in path.parents:
        return None
    return path


# Persist an ID card image as an encrypted file; returns a relative storage key.
def save_id_card(data_url: str) -> str:
    name = f"{uuid.uuid4().hex}.enc"
    path = _ensure_dir(ID_CARD_SUBDIR) / name
    path.write_text(encrypt_image(data_url), encoding="ascii")
    return f"{ID_CARD_SUBDIR}/{name}"


# Load an ID card as a data URL from disk or legacy inline ciphertext.
def load_id_card(stored: str) -> str:
    path = _id_card_path(stored)
    if path and path.is_file():
        return decrypt_image(path.read_text(encoding="ascii"))
    return decrypt_image(stored)


# Decode a stored ID card data URL into raw bytes and MIME type.
def id_card_bytes(stored: str) -> tuple[bytes, str]:
    data_url = load_id_card(stored)
    match = _DATA_URL_RE.match(data_url or "")
    if not match:
        raise ValueError("Stored ID card is not a valid image")
    mime = match.group("mime").lower()
    return base64.b64decode(match.group("data")), mime


# Remove a stored ID card file (best-effort).
def delete_id_card(stored: str | None) -> None:
    path = _id_card_path(stored or "")
    if not path or not path.is_file():
        return
    try:
        path.unlink()
    except OSError:
        pass
