from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HealthRecordResponse(BaseModel):
    id: UUID
    patient_id: UUID
    record_type: str
    fhir_resource_type: str
    fhir_resource: dict
    source_format: str
    effective_date: datetime | None
    status: str | None
    category: list[str] | None
    code_system: str | None
    code_value: str | None
    code_display: str | None
    display_text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecordListResponse(BaseModel):
    items: list[HealthRecordResponse]
    total: int
    page: int
    page_size: int
