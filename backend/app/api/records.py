from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/records", tags=["records"])


@router.get("")
async def list_records():
    """List health records (paginated, filterable). Stub — Phase 3."""
    return {"items": [], "total": 0, "page": 1, "page_size": 20}


@router.get("/search")
async def search_records():
    """Full-text search records. Stub — Phase 3."""
    return {"items": [], "total": 0}


@router.get("/{record_id}")
async def get_record(record_id: str):
    """Get single record with FHIR resource. Stub — Phase 3."""
    return {"detail": "Not implemented yet"}
