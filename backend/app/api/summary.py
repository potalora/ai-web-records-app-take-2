from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/summary", tags=["summary"])


@router.post("/build-prompt")
async def build_prompt():
    """Build de-identified prompt (returns prompt, NOT AI response). Stub — Phase 4."""
    return {"detail": "Not implemented yet"}


@router.get("/prompts")
async def list_prompts():
    """List previously built prompts. Stub — Phase 4."""
    return {"items": [], "total": 0}


@router.get("/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    """Get prompt detail. Stub — Phase 4."""
    return {"detail": "Not implemented yet"}


@router.post("/paste-response")
async def paste_response():
    """User pastes AI response back for storage. Stub — Phase 4."""
    return {"detail": "Not implemented yet"}


@router.get("/responses")
async def list_responses():
    """List stored responses. Stub — Phase 4."""
    return {"items": [], "total": 0}
