from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_authenticated_user_id
from app.middleware.audit import log_audit_event
from app.models.deduplication import DedupCandidate
from app.models.patient import Patient
from app.models.record import HealthRecord
from app.schemas.dedup import DedupCandidateResponse, DismissRequest, MergeRequest

router = APIRouter(prefix="/dedup", tags=["dedup"])


@router.get("/candidates")
async def list_candidates(
    request: Request,
    page: int = 1,
    limit: int = 20,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List dedup candidates with record details (paginated)."""
    from sqlalchemy import func
    from sqlalchemy.orm import aliased

    RecordA = aliased(HealthRecord)
    RecordB = aliased(HealthRecord)

    # Base query with JOINs — filter by user through record_a
    base = (
        select(DedupCandidate, RecordA, RecordB)
        .join(RecordA, DedupCandidate.record_a_id == RecordA.id)
        .join(RecordB, DedupCandidate.record_b_id == RecordB.id)
        .where(
            RecordA.user_id == user_id,
            DedupCandidate.status == "pending",
        )
    )

    # Count total pending candidates (use a subquery for efficiency)
    count_q = select(func.count()).select_from(base.subquery())
    count_result = await db.execute(count_q)
    total = count_result.scalar() or 0

    if total == 0:
        await log_audit_event(
            db, user_id=user_id, action="dedup.list_candidates",
            resource_type="dedup",
            ip_address=request.client.host if request.client else None,
            details={"total": 0, "page": page},
        )
        return {"items": [], "total": 0}

    # Paginated fetch with JOIN
    offset = (page - 1) * limit
    result = await db.execute(
        base.order_by(DedupCandidate.similarity_score.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()

    items = []
    for candidate, record_a, record_b in rows:
        items.append({
            "id": str(candidate.id),
            "similarity_score": candidate.similarity_score,
            "match_reasons": candidate.match_reasons,
            "status": candidate.status,
            "record_a": {
                "id": str(record_a.id),
                "display_text": record_a.display_text,
                "record_type": record_a.record_type,
                "source_format": record_a.source_format,
                "effective_date": record_a.effective_date.isoformat()
                if record_a.effective_date
                else None,
            },
            "record_b": {
                "id": str(record_b.id),
                "display_text": record_b.display_text,
                "record_type": record_b.record_type,
                "source_format": record_b.source_format,
                "effective_date": record_b.effective_date.isoformat()
                if record_b.effective_date
                else None,
            },
        })

    await log_audit_event(
        db, user_id=user_id, action="dedup.list_candidates",
        resource_type="dedup",
        ip_address=request.client.host if request.client else None,
        details={"total": total, "page": page},
    )

    return {"items": items, "total": total}


@router.post("/merge")
async def merge_records(
    body: MergeRequest,
    request: Request,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Merge two duplicate records."""
    result = await db.execute(
        select(DedupCandidate).where(DedupCandidate.id == body.candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Determine primary and secondary records
    primary_id = body.primary_record_id if body.primary_record_id else candidate.record_a_id
    secondary_id = (
        candidate.record_b_id
        if primary_id == candidate.record_a_id
        else candidate.record_a_id
    )

    # Mark secondary as duplicate
    sec_result = await db.execute(
        select(HealthRecord).where(
            HealthRecord.id == secondary_id,
            HealthRecord.user_id == user_id,
        )
    )
    secondary = sec_result.scalar_one_or_none()
    if secondary:
        secondary.is_duplicate = True
        secondary.merged_into_id = primary_id

    candidate.status = "merged"
    candidate.resolved_by = user_id
    candidate.resolved_at = datetime.now(timezone.utc)
    await db.commit()

    await log_audit_event(
        db,
        user_id=user_id,
        action="dedup.merge",
        resource_type="dedup",
        resource_id=body.candidate_id,
        ip_address=request.client.host if request.client else None,
        details={"candidate_id": str(body.candidate_id), "primary_record_id": str(primary_id)},
    )

    return {
        "status": "merged",
        "primary_record_id": str(primary_id),
        "archived_record_id": str(secondary_id),
    }


@router.post("/dismiss")
async def dismiss_candidate(
    body: DismissRequest,
    request: Request,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss a dedup candidate pair."""
    result = await db.execute(
        select(DedupCandidate).where(DedupCandidate.id == body.candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.status = "dismissed"
    candidate.resolved_by = user_id
    candidate.resolved_at = datetime.now(timezone.utc)
    await db.commit()

    await log_audit_event(
        db,
        user_id=user_id,
        action="dedup.dismiss",
        resource_type="dedup",
        resource_id=body.candidate_id,
        ip_address=request.client.host if request.client else None,
        details={"candidate_id": str(body.candidate_id)},
    )

    return {"status": "dismissed"}


@router.post("/scan")
async def scan_for_duplicates(
    request: Request,
    user_id: UUID = Depends(get_authenticated_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a duplicate scan for all patient records."""
    from app.services.dedup.detector import detect_duplicates

    result = await db.execute(
        select(Patient).where(Patient.user_id == user_id)
    )
    patients = result.scalars().all()

    total_found = 0
    for patient in patients:
        count = await detect_duplicates(db, user_id, patient.id)
        total_found += count

    await log_audit_event(
        db,
        user_id=user_id,
        action="dedup.scan",
        resource_type="dedup",
        ip_address=request.client.host if request.client else None,
        details={"candidates_found": total_found},
    )

    return {"candidates_found": total_found}
