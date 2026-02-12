from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UploadResponse(BaseModel):
    id: UUID
    filename: str
    ingestion_status: str
    record_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class IngestionStatusResponse(BaseModel):
    id: UUID
    filename: str
    ingestion_status: str
    ingestion_progress: dict
    ingestion_errors: list
    record_count: int
    total_file_count: int
    processing_started_at: datetime | None
    processing_completed_at: datetime | None

    model_config = {"from_attributes": True}
