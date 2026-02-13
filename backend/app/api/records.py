from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_authenticated_user_id
from app.middleware.audit import log_audit_event
from app.models.record import HealthRecord
from app.schemas.records import HealthRecordResponse, RecordListResponse

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=RecordListResponse)
async def list_records(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    record_type: str | None = None,
    category: str | None = None,
    search: str | None = None,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
) -> RecordListResponse:
    """List health records with pagination and filtering."""
    query = select(HealthRecord).where(
        HealthRecord.user_id == user_id,
        HealthRecord.deleted_at.is_(None),
        HealthRecord.is_duplicate.is_(False),
    )

    if record_type:
        query = query.where(HealthRecord.record_type == record_type)
    if search:
        query = query.where(
            or_(
                HealthRecord.display_text.ilike(f"%{search}%"),
                HealthRecord.code_display.ilike(f"%{search}%"),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch page
    query = query.order_by(HealthRecord.effective_date.desc().nullslast())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()

    await log_audit_event(
        db,
        user_id=user_id,
        action="records.list",
        resource_type="health_record",
        ip_address=request.client.host if request.client else None,
        details={"record_type": record_type, "search": search, "page": page, "total": total},
    )

    return RecordListResponse(
        items=[HealthRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/search")
async def search_records(
    request: Request,
    q: str = Query("", min_length=1),
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search records."""
    query = (
        select(HealthRecord)
        .where(
            HealthRecord.user_id == user_id,
            HealthRecord.deleted_at.is_(None),
            or_(
                HealthRecord.display_text.ilike(f"%{q}%"),
                HealthRecord.code_display.ilike(f"%{q}%"),
            ),
        )
        .order_by(HealthRecord.effective_date.desc().nullslast())
        .limit(50)
    )
    result = await db.execute(query)
    records = result.scalars().all()

    await log_audit_event(
        db,
        user_id=user_id,
        action="records.search",
        resource_type="health_record",
        ip_address=request.client.host if request.client else None,
        details={"query": q, "result_count": len(records)},
    )

    return {
        "items": [HealthRecordResponse.model_validate(r) for r in records],
        "total": len(records),
    }


@router.get("/{record_id}", response_model=HealthRecordResponse)
async def get_record(
    record_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
) -> HealthRecordResponse:
    """Get single record with FHIR resource."""
    result = await db.execute(
        select(HealthRecord).where(
            HealthRecord.id == record_id,
            HealthRecord.user_id == user_id,
            HealthRecord.deleted_at.is_(None),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    await log_audit_event(
        db,
        user_id=user_id,
        action="records.view",
        resource_type="health_record",
        resource_id=record_id,
        ip_address=request.client.host if request.client else None,
    )

    return HealthRecordResponse.model_validate(record)


@router.delete("/{record_id}", status_code=204)
async def delete_record(
    record_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a health record."""
    from datetime import datetime, timezone

    result = await db.execute(
        select(HealthRecord).where(
            HealthRecord.id == record_id,
            HealthRecord.user_id == user_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    record.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    await log_audit_event(
        db,
        user_id=user_id,
        action="records.delete",
        resource_type="health_record",
        resource_id=record_id,
        ip_address=request.client.host if request.client else None,
    )
