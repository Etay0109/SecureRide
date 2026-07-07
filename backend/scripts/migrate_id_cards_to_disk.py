# backend/scripts/migrate_id_cards_to_disk.py
"""One-off migration: move inline encrypted ID cards to encrypted files on disk.

Run once from the backend/ directory:

    python -m scripts.migrate_id_cards_to_disk
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from database import async_session  # noqa: E402
from models import User  # noqa: E402
from storage import ID_CARD_SUBDIR  # noqa: E402


async def main() -> None:
    converted = 0
    async with async_session() as db:
        rows = (await db.execute(select(User).where(User.id_card_image.isnot(None)))).scalars().all()
        for user in rows:
            stored = user.id_card_image or ""
            if stored.startswith(f"{ID_CARD_SUBDIR}/"):
                continue
            user.id_card_image = save_id_card_from_legacy(stored)
            converted += 1
        await db.commit()
    print(f"Migrated {converted} ID card(s) from inline ciphertext to disk.")


def save_id_card_from_legacy(cipher: str) -> str:
    """Write legacy DB ciphertext to disk without re-encrypting."""
    from storage import _ensure_dir
    import uuid

    name = f"{uuid.uuid4().hex}.enc"
    path = _ensure_dir(ID_CARD_SUBDIR) / name
    path.write_text(cipher, encoding="ascii")
    return f"{ID_CARD_SUBDIR}/{name}"


if __name__ == "__main__":
    asyncio.run(main())
