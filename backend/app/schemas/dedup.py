from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DedupCandidateResponse(BaseModel):
    id: UUID
    record_a_id: UUID
    record_b_id: UUID
    similarity_score: float
    match_reasons: dict
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MergeRequest(BaseModel):
    candidate_id: UUID
    primary_record_id: UUID | None = None


class DismissRequest(BaseModel):
    candidate_id: UUID
