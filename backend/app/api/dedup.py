from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/dedup", tags=["dedup"])


@router.get("/candidates")
async def list_candidates():
    """List dedup candidates. Stub — Phase 5."""
    return {"items": [], "total": 0}


@router.post("/merge")
async def merge_records():
    """Merge two records. Stub — Phase 5."""
    return {"detail": "Not implemented yet"}


@router.post("/dismiss")
async def dismiss_candidate():
    """Dismiss candidate pair. Stub — Phase 5."""
    return {"detail": "Not implemented yet"}
