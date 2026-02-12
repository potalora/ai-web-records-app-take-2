from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("")
async def get_timeline():
    """Timeline data (date-ordered, filterable). Stub — Phase 3."""
    return {"events": [], "total": 0}


@router.get("/stats")
async def get_timeline_stats():
    """Aggregated stats for dashboard. Stub — Phase 3."""
    return {"total_records": 0, "records_by_type": {}}
