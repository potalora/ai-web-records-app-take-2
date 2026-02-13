from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deduplication import DedupCandidate
from app.models.record import HealthRecord
from tests.conftest import auth_headers, create_test_patient, seed_test_records


async def _create_duplicate_pair(
    db_session: AsyncSession, user_id: str, patient_id,
) -> tuple[HealthRecord, HealthRecord, DedupCandidate]:
    """Create two similar records and a dedup candidate."""
    uid = UUID(user_id)
    rec_a = HealthRecord(
        id=uuid4(),
        patient_id=patient_id,
        user_id=uid,
        record_type="medication",
        fhir_resource_type="MedicationRequest",
        fhir_resource={"resourceType": "MedicationRequest"},
        source_format="fhir_r4",
        display_text="Lisinopril 10 MG Oral Tablet",
        code_value="197361",
        effective_date=datetime(2024, 1, 15, tzinfo=timezone.utc),
    )
    rec_b = HealthRecord(
        id=uuid4(),
        patient_id=patient_id,
        user_id=uid,
        record_type="medication",
        fhir_resource_type="MedicationRequest",
        fhir_resource={"resourceType": "MedicationRequest"},
        source_format="epic_ehi",
        display_text="LISINOPRIL 10MG TAB",
        code_value="197361",
        effective_date=datetime(2024, 1, 15, tzinfo=timezone.utc),
    )
    db_session.add_all([rec_a, rec_b])
    await db_session.commit()

    candidate = DedupCandidate(
        id=uuid4(),
        record_a_id=rec_a.id,
        record_b_id=rec_b.id,
        similarity_score=0.92,
        match_reasons={"code_match": True, "date_proximity": True},
        status="pending",
    )
    db_session.add(candidate)
    await db_session.commit()
    await db_session.refresh(rec_a)
    await db_session.refresh(rec_b)
    await db_session.refresh(candidate)
    return rec_a, rec_b, candidate


@pytest.mark.asyncio
async def test_candidates_unauthenticated(client: AsyncClient):
    """GET /dedup/candidates without token returns 401."""
    resp = await client.get("/api/v1/dedup/candidates")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_candidates_empty(client: AsyncClient, db_session: AsyncSession):
    """GET /dedup/candidates with no data returns empty."""
    headers, _ = await auth_headers(client)
    resp = await client.get("/api/v1/dedup/candidates", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_candidates_with_data(client: AsyncClient, db_session: AsyncSession):
    """Candidates include record_a and record_b objects."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    _, _, candidate = await _create_duplicate_pair(db_session, uid, patient.id)

    resp = await client.get("/api/v1/dedup/candidates", headers=headers)
    data = resp.json()
    assert data["total"] >= 1

    item = data["items"][0]
    assert "record_a" in item
    assert "record_b" in item
    assert item["record_a"]["display_text"] == "Lisinopril 10 MG Oral Tablet"
    assert item["record_b"]["display_text"] == "LISINOPRIL 10MG TAB"
    assert item["similarity_score"] == 0.92


@pytest.mark.asyncio
async def test_merge_without_primary(client: AsyncClient, db_session: AsyncSession):
    """Fix 1 & 2: Merge with only candidate_id defaults record_a as primary."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    rec_a, rec_b, candidate = await _create_duplicate_pair(db_session, uid, patient.id)

    resp = await client.post(
        "/api/v1/dedup/merge",
        headers=headers,
        json={"candidate_id": str(candidate.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "merged"
    assert data["primary_record_id"] == str(rec_a.id)
    assert data["archived_record_id"] == str(rec_b.id)


@pytest.mark.asyncio
async def test_merge_with_primary(client: AsyncClient, db_session: AsyncSession):
    """Merge with explicit primary_record_id."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    rec_a, rec_b, candidate = await _create_duplicate_pair(db_session, uid, patient.id)

    resp = await client.post(
        "/api/v1/dedup/merge",
        headers=headers,
        json={"candidate_id": str(candidate.id), "primary_record_id": str(rec_b.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["primary_record_id"] == str(rec_b.id)
    assert data["archived_record_id"] == str(rec_a.id)


@pytest.mark.asyncio
async def test_merge_marks_secondary_as_duplicate(client: AsyncClient, db_session: AsyncSession):
    """After merge, secondary record is marked is_duplicate=True."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    rec_a, rec_b, candidate = await _create_duplicate_pair(db_session, uid, patient.id)

    await client.post(
        "/api/v1/dedup/merge",
        headers=headers,
        json={"candidate_id": str(candidate.id)},
    )

    # Verify secondary is excluded from records list (is_duplicate=True)
    resp = await client.get("/api/v1/records", headers=headers)
    ids = [item["id"] for item in resp.json()["items"]]
    assert str(rec_a.id) in ids
    assert str(rec_b.id) not in ids


@pytest.mark.asyncio
async def test_dismiss(client: AsyncClient, db_session: AsyncSession):
    """Fix 3: Dismiss returns only {status: 'dismissed'}."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    _, _, candidate = await _create_duplicate_pair(db_session, uid, patient.id)

    resp = await client.post(
        "/api/v1/dedup/dismiss",
        headers=headers,
        json={"candidate_id": str(candidate.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"status": "dismissed"}


@pytest.mark.asyncio
async def test_scan_creates_candidates(client: AsyncClient, db_session: AsyncSession):
    """Scan detects duplicates for similar records."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)

    # Create two very similar records
    uid_uuid = UUID(uid)
    rec1 = HealthRecord(
        id=uuid4(),
        patient_id=patient.id,
        user_id=uid_uuid,
        record_type="medication",
        fhir_resource_type="MedicationRequest",
        fhir_resource={"resourceType": "MedicationRequest"},
        source_format="fhir_r4",
        display_text="Metformin 500mg",
        code_value="860975",
        effective_date=datetime(2024, 1, 15, tzinfo=timezone.utc),
        status="active",
    )
    rec2 = HealthRecord(
        id=uuid4(),
        patient_id=patient.id,
        user_id=uid_uuid,
        record_type="medication",
        fhir_resource_type="MedicationRequest",
        fhir_resource={"resourceType": "MedicationRequest"},
        source_format="epic_ehi",
        display_text="Metformin 500mg",
        code_value="860975",
        effective_date=datetime(2024, 1, 15, tzinfo=timezone.utc),
        status="active",
    )
    db_session.add_all([rec1, rec2])
    await db_session.commit()

    resp = await client.post("/api/v1/dedup/scan", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["candidates_found"] >= 1


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient, db_session: AsyncSession):
    """User A's dedup candidates don't appear for User B."""
    headers_a, uid_a = await auth_headers(client, email="dedup_a@test.com")
    headers_b, _ = await auth_headers(client, email="dedup_b@test.com")

    patient = await create_test_patient(db_session, uid_a)
    await _create_duplicate_pair(db_session, uid_a, patient.id)

    resp = await client.get("/api/v1/dedup/candidates", headers=headers_b)
    data = resp.json()
    assert data["total"] == 0
