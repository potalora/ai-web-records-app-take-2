from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import auth_headers, create_test_patient, seed_test_records


@pytest.mark.asyncio
async def test_timeline_unauthenticated(client: AsyncClient):
    """GET /timeline without token returns 401."""
    resp = await client.get("/api/v1/timeline")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_timeline_empty(client: AsyncClient, db_session: AsyncSession):
    """Timeline with no data returns empty events."""
    headers, _ = await auth_headers(client)
    resp = await client.get("/api/v1/timeline", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["events"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_timeline_with_data(client: AsyncClient, db_session: AsyncSession):
    """Timeline returns events with correct schema, ordered by date DESC."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=5)

    resp = await client.get("/api/v1/timeline", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["events"]) == 5

    # Verify event schema per handoff
    for event in data["events"]:
        for field in ["id", "record_type", "display_text", "effective_date", "code_display", "category"]:
            assert field in event, f"Missing field: {field}"

    # Verify DESC ordering
    dates = [e["effective_date"] for e in data["events"] if e["effective_date"]]
    assert dates == sorted(dates, reverse=True)


@pytest.mark.asyncio
async def test_timeline_filter_by_type(client: AsyncClient, db_session: AsyncSession):
    """Timeline filter by record_type returns correct subset."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=10)

    resp = await client.get("/api/v1/timeline?record_type=condition", headers=headers)
    data = resp.json()
    for event in data["events"]:
        assert event["record_type"] == "condition"
    assert data["total"] == len(data["events"])


@pytest.mark.asyncio
async def test_timeline_total_reflects_pre_limit_count(client: AsyncClient, db_session: AsyncSession):
    """Fix 7: total reflects count BEFORE limit is applied."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=10)

    resp = await client.get("/api/v1/timeline?limit=3", headers=headers)
    data = resp.json()
    assert len(data["events"]) == 3
    assert data["total"] == 10  # total should be 10, not 3


@pytest.mark.asyncio
async def test_timeline_excludes_records_without_date(client: AsyncClient, db_session: AsyncSession):
    """Records without effective_date are excluded from timeline."""
    from uuid import uuid4
    from app.models.record import HealthRecord

    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=3)

    # Add record with no date
    from uuid import UUID
    rec = HealthRecord(
        id=uuid4(),
        patient_id=patient.id,
        user_id=UUID(uid),
        record_type="condition",
        fhir_resource_type="Condition",
        fhir_resource={"resourceType": "Condition"},
        source_format="fhir_r4",
        display_text="No date record",
        effective_date=None,
    )
    db_session.add(rec)
    await db_session.commit()

    resp = await client.get("/api/v1/timeline", headers=headers)
    data = resp.json()
    # The no-date record should be excluded
    assert data["total"] == 3


@pytest.mark.asyncio
async def test_timeline_stats(client: AsyncClient, db_session: AsyncSession):
    """GET /timeline/stats returns aggregated statistics."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=5)

    resp = await client.get("/api/v1/timeline/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_records"] == 5
    assert isinstance(data["records_by_type"], dict)
    assert data["date_range_start"] is not None
    assert data["date_range_end"] is not None


@pytest.mark.asyncio
async def test_timeline_stats_unauthenticated(client: AsyncClient):
    """GET /timeline/stats without token returns 401."""
    resp = await client.get("/api/v1/timeline/stats")
    assert resp.status_code == 401
