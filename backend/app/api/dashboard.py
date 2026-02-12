from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
async def get_overview():
    """Dashboard summary data. Stub — Phase 3."""
    return {"total_records": 0, "total_patients": 0}


@router.get("/labs")
async def get_labs_dashboard():
    """Lab-specific dashboard data. Stub — Phase 3."""
    return {"items": [], "total": 0}
