from __future__ import annotations

import logging
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deduplication import DedupCandidate
from app.models.record import HealthRecord

logger = logging.getLogger(__name__)


async def detect_duplicates(
    db: AsyncSession,
    user_id: UUID,
    patient_id: UUID,
) -> int:
    """Scan for duplicate records and create dedup candidates.

    Uses hash-based bucketing to reduce comparisons from O(n^2) to
    bucket-scoped pairs, batch existence checks via an in-memory set,
    and bulk inserts for new candidates.

    Returns the number of new candidates found.
    """
    # Fetch all active records for patient
    result = await db.execute(
        select(HealthRecord)
        .where(
            HealthRecord.user_id == user_id,
            HealthRecord.patient_id == patient_id,
            HealthRecord.deleted_at.is_(None),
            HealthRecord.is_duplicate.is_(False),
        )
        .order_by(HealthRecord.effective_date.asc().nullslast())
    )
    records = result.scalars().all()

    if len(records) < 2:
        return 0

    # Pre-load all existing candidate pairs into a set (batch existence check)
    existing_result = await db.execute(
        select(DedupCandidate.record_a_id, DedupCandidate.record_b_id)
    )
    existing_pairs: set[tuple[UUID, UUID]] = set()
    for r in existing_result.all():
        existing_pairs.add((r[0], r[1]))
        existing_pairs.add((r[1], r[0]))  # both orderings

    # Group records by type + code/text key for bucket-based comparison
    buckets: dict[tuple, list[HealthRecord]] = {}
    for r in records:
        key = (r.record_type, (r.code_value or (r.display_text or "")[:50].lower()))
        buckets.setdefault(key, []).append(r)

    new_candidates: list[dict] = []

    for key, bucket in buckets.items():
        if len(bucket) < 2:
            continue
        for i, a in enumerate(bucket):
            for b in bucket[i + 1 :]:
                score, reasons = _compare_records(a, b)
                if score >= 0.7:
                    if (a.id, b.id) in existing_pairs:
                        continue
                    new_candidates.append({
                        "id": uuid4(),
                        "record_a_id": a.id,
                        "record_b_id": b.id,
                        "similarity_score": score,
                        "match_reasons": reasons,
                        "status": "pending",
                    })
                    # Add to existing_pairs to prevent duplicate inserts within same run
                    existing_pairs.add((a.id, b.id))
                    existing_pairs.add((b.id, a.id))

    if new_candidates:
        from sqlalchemy import insert

        # Insert in batches of 100
        for i in range(0, len(new_candidates), 100):
            batch = new_candidates[i : i + 100]
            await db.execute(insert(DedupCandidate), batch)
        await db.commit()

    candidates_found = len(new_candidates)
    logger.info("Found %d dedup candidates for patient %s", candidates_found, patient_id)
    return candidates_found


def _compare_records(a: HealthRecord, b: HealthRecord) -> tuple[float, dict]:
    """Compare two records for similarity.

    Returns (score, reasons) where score is 0-1.
    """
    score = 0.0
    reasons = {}

    # Same code = strong match
    if a.code_value and b.code_value and a.code_value == b.code_value:
        score += 0.4
        reasons["code_match"] = True

    # Same display text
    if a.display_text and b.display_text:
        if a.display_text.lower() == b.display_text.lower():
            score += 0.3
            reasons["text_exact_match"] = True
        elif _fuzzy_match(a.display_text, b.display_text) > 0.8:
            score += 0.2
            reasons["text_fuzzy_match"] = True

    # Same date (within 24h)
    if a.effective_date and b.effective_date:
        delta = abs((a.effective_date - b.effective_date).total_seconds())
        if delta < 86400:  # 24 hours
            score += 0.2
            reasons["date_proximity"] = True

    # Same status
    if a.status and b.status and a.status == b.status:
        score += 0.1
        reasons["status_match"] = True

    # Cross-source is a strong signal
    if a.source_format != b.source_format:
        score += 0.1
        reasons["cross_source"] = True

    return min(score, 1.0), reasons


def _fuzzy_match(a: str, b: str) -> float:
    """Simple fuzzy string matching using character overlap."""
    a_lower = a.lower()
    b_lower = b.lower()
    if a_lower == b_lower:
        return 1.0

    # Use set intersection for quick similarity
    set_a = set(a_lower.split())
    set_b = set(b_lower.split())
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union) if union else 0.0
