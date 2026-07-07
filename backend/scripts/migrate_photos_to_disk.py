# backend/scripts/migrate_photos_to_disk.py
"""One-off, opt-in migration: move existing base64 listing photos to disk.

Run once from the backend/ directory after deploying the disk-storage change:

    python -m scripts.migrate_photos_to_disk

Idempotent: rows whose photos are already stored URLs are skipped.
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from database import async_session  # noqa: E402
from models import Listing  # noqa: E402
from serializers import load_photos  # noqa: E402
from storage import persist_photos  # noqa: E402


async def main() -> None:
    converted = 0
    async with async_session() as db:
        rows = (await db.execute(select(Listing))).scalars().all()
        for listing in rows:
            photos = load_photos(listing.photos)
            if not any(p.startswith("data:") for p in photos):
                continue
            listing.photos = json.dumps(persist_photos(photos))
            converted += 1
        await db.commit()
    print(f"Converted {converted} listing(s) with inline base64 photos to disk.")


if __name__ == "__main__":
    asyncio.run(main())
