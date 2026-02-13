from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import auth_headers, create_test_patient, seed_test_records


@pytest.mark.asyncio
async def test_overview_unauthenticated(client: AsyncClient):
    """GET /dashboard/overview without token returns 401."""
    resp = await client.get("/api/v1/dashboard/overview")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_overview_empty(client: AsyncClient, db_session: AsyncSession):
    """Dashboard overview with no data returns zero counts."""
    headers, _ = await auth_headers(client)
    resp = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_records"] == 0
    assert data["total_patients"] == 0
    assert data["total_uploads"] == 0
    assert data["records_by_type"] == {}
    assert data["recent_records"] == []


@pytest.mark.asyncio
async def test_overview_with_data(client: AsyncClient, db_session: AsyncSession):
    """Dashboard overview returns correct aggregates after seeding data."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=5)

    resp = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_records"] == 5
    assert data["total_patients"] == 1
    assert isinstance(data["records_by_type"], dict)
    assert sum(data["records_by_type"].values()) == 5

    # Verify handoff fields
    for field in [
        "total_records", "total_patients", "total_uploads",
        "records_by_type", "recent_records",
        "date_range_start", "date_range_end",
    ]:
        assert field in data, f"Missing field: {field}"

    # recent_records items have correct schema
    assert len(data["recent_records"]) <= 10
    for item in data["recent_records"]:
        assert "id" in item
        assert "record_type" in item
        assert "display_text" in item
        assert "effective_date" in item
        assert "created_at" in item


@pytest.mark.asyncio
async def test_overview_user_isolation(client: AsyncClient, db_session: AsyncSession):
    """User A's records don't appear in User B's dashboard."""
    headers_a, uid_a = await auth_headers(client, email="a@test.com")
    headers_b, uid_b = await auth_headers(client, email="b@test.com")

    patient = await create_test_patient(db_session, uid_a)
    await seed_test_records(db_session, uid_a, patient.id, count=5)

    resp = await client.get("/api/v1/dashboard/overview", headers=headers_b)
    data = resp.json()
    assert data["total_records"] == 0


@pytest.mark.asyncio
async def test_overview_excludes_deleted(client: AsyncClient, db_session: AsyncSession):
    """Deleted records are excluded from dashboard counts."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    records = await seed_test_records(db_session, uid, patient.id, count=3)

    # Soft-delete one record
    await client.delete(f"/api/v1/records/{records[0].id}", headers=headers)

    resp = await client.get("/api/v1/dashboard/overview", headers=headers)
    data = resp.json()
    assert data["total_records"] == 2


@pytest.mark.asyncio
async def test_labs_unauthenticated(client: AsyncClient):
    """GET /dashboard/labs without token returns 401."""
    resp = await client.get("/api/v1/dashboard/labs")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_labs_empty(client: AsyncClient, db_session: AsyncSession):
    """Labs dashboard with no data returns empty items."""
    headers, _ = await auth_headers(client)
    resp = await client.get("/api/v1/dashboard/labs", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []


@pytest.mark.asyncio
async def test_labs_with_observations(client: AsyncClient, db_session: AsyncSession):
    """Labs dashboard returns observation records with correct schema."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=5)

    resp = await client.get("/api/v1/dashboard/labs", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) >= 1

    # Verify handoff fields for lab items
    for item in data["items"]:
        for field in [
            "id", "display_text", "effective_date",
            "value", "unit", "reference_low", "reference_high",
            "interpretation", "code_display", "code_value",
        ]:
            assert field in item, f"Missing field: {field}"

    # Verify actual values from our seeded observation
    obs_items = [i for i in data["items"] if i["code_display"] == "Hemoglobin A1c"]
    assert len(obs_items) >= 1
    obs = obs_items[0]
    assert obs["value"] == 6.8
    assert obs["unit"] == "%"
    assert obs["reference_low"] == 4.0
    assert obs["reference_high"] == 5.6
    assert obs["interpretation"] == "H"


@pytest.mark.asyncio
async def test_labs_excludes_non_observations(client: AsyncClient, db_session: AsyncSession):
    """Labs endpoint only returns observation records, not conditions/meds."""
    headers, uid = await auth_headers(client)
    patient = await create_test_patient(db_session, uid)
    await seed_test_records(db_session, uid, patient.id, count=5)

    # Get lab items
    resp = await client.get("/api/v1/dashboard/labs", headers=headers)
    data = resp.json()
    # Get all records
    all_resp = await client.get("/api/v1/records", headers=headers)
    all_data = all_resp.json()

    # Labs should be fewer than total
    obs_count = sum(1 for i in all_data["items"] if i["record_type"] == "observation")
    assert len(data["items"]) == obs_count
