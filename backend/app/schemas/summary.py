from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BuildPromptRequest(BaseModel):
    patient_id: UUID
    summary_type: str = "full"
    category: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    record_ids: list[UUID] | None = None


class PromptResponse(BaseModel):
    id: UUID
    summary_type: str
    system_prompt: str
    user_prompt: str
    target_model: str
    suggested_config: dict
    record_count: int
    de_identification_report: dict | None
    copyable_payload: str
    generated_at: datetime


class PasteResponseRequest(BaseModel):
    prompt_id: UUID
    response_text: str
