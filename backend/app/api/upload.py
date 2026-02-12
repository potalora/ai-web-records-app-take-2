from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
async def upload_file():
    """Upload file(s) — multipart. Stub — Phase 2."""
    return {"detail": "Not implemented yet"}


@router.post("/epic-export")
async def upload_epic_export():
    """Upload Epic EHI Tables export. Stub — Phase 2."""
    return {"detail": "Not implemented yet"}


@router.get("/{upload_id}/status")
async def get_upload_status(upload_id: str):
    """Ingestion job status. Stub — Phase 2."""
    return {"detail": "Not implemented yet"}


@router.get("/{upload_id}/errors")
async def get_upload_errors(upload_id: str):
    """Ingestion errors for a specific upload. Stub — Phase 2."""
    return {"detail": "Not implemented yet"}


@router.get("/history")
async def get_upload_history():
    """Upload history with record counts. Stub — Phase 2."""
    return {"items": [], "total": 0}
