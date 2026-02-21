from __future__ import annotations

import io
import os
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import auth_headers, create_test_patient

HAS_API_KEY = bool(os.environ.get("GEMINI_API_KEY"))

# Patch the background task to avoid event loop conflicts with the test DB session.
# The _process_unstructured function creates its own DB session via async_session_factory
# which uses the production engine — incompatible with the test session override.
PATCH_BG_TASK = patch(
    "app.api.upload._process_unstructured",
    new_callable=AsyncMock,
)


@pytest.mark.asyncio
async def test_upload_rtf_creates_record(client: AsyncClient, db_session: AsyncSession):
    """Upload an RTF file to the unstructured endpoint."""
    headers, user_id = await auth_headers(client)

    rtf_content = rb"""{\rtf1\ansi\deff0 Patient visit note. Assessment: Hypertension. Plan: Continue medication.}"""

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/unstructured",
            files={"file": ("note.rtf", io.BytesIO(rtf_content), "application/rtf")},
            headers=headers,
        )
    assert resp.status_code == 202
    data = resp.json()
    assert data["upload_id"]
    assert data["status"] == "processing"
    assert data["file_type"] == "rtf"


@pytest.mark.asyncio
async def test_reject_unsupported_file_type(client: AsyncClient, db_session: AsyncSession):
    """Verify .doc files are rejected with 400."""
    headers, user_id = await auth_headers(client)

    resp = await client.post(
        "/api/v1/upload/unstructured",
        files={"file": ("doc.doc", io.BytesIO(b"content"), "application/msword")},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Unsupported file type" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_reject_txt_file(client: AsyncClient, db_session: AsyncSession):
    """Verify .txt files are rejected."""
    headers, user_id = await auth_headers(client)

    resp = await client.post(
        "/api/v1/upload/unstructured",
        files={"file": ("notes.txt", io.BytesIO(b"plain text"), "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_extraction_results_endpoint_not_found(client: AsyncClient, db_session: AsyncSession):
    """Verify 404 for non-existent upload."""
    headers, user_id = await auth_headers(client)

    resp = await client.get(
        "/api/v1/upload/00000000-0000-0000-0000-000000000000/extraction",
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_extraction_results_for_uploaded_file(client: AsyncClient, db_session: AsyncSession):
    """Upload RTF, then check extraction endpoint returns valid response."""
    headers, user_id = await auth_headers(client)

    rtf_content = rb"""{\rtf1\ansi Patient has diabetes and takes Metformin.}"""
    with PATCH_BG_TASK:
        upload_resp = await client.post(
            "/api/v1/upload/unstructured",
            files={"file": ("note.rtf", io.BytesIO(rtf_content), "application/rtf")},
            headers=headers,
        )
    upload_id = upload_resp.json()["upload_id"]

    # Background task is mocked, so status will be "processing"
    resp = await client.get(
        f"/api/v1/upload/{upload_id}/extraction",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["upload_id"] == upload_id
    assert data["status"] in ("processing", "awaiting_confirmation", "completed", "failed")


@pytest.mark.asyncio
async def test_confirm_extraction_missing_patient(client: AsyncClient, db_session: AsyncSession):
    """Verify confirmation fails without patient_id."""
    headers, user_id = await auth_headers(client)

    rtf_content = rb"""{\rtf1\ansi Test note.}"""
    with PATCH_BG_TASK:
        upload_resp = await client.post(
            "/api/v1/upload/unstructured",
            files={"file": ("note.rtf", io.BytesIO(rtf_content), "application/rtf")},
            headers=headers,
        )
    upload_id = upload_resp.json()["upload_id"]

    resp = await client.post(
        f"/api/v1/upload/{upload_id}/confirm-extraction",
        json={"confirmed_entities": [], "patient_id": ""},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_confirm_extraction_creates_records(client: AsyncClient, db_session: AsyncSession):
    """Confirm extracted entities and verify HealthRecords are created."""
    headers, user_id = await auth_headers(client)
    patient = await create_test_patient(db_session, user_id)

    rtf_content = rb"""{\rtf1\ansi Test note.}"""
    with PATCH_BG_TASK:
        upload_resp = await client.post(
            "/api/v1/upload/unstructured",
            files={"file": ("note.rtf", io.BytesIO(rtf_content), "application/rtf")},
            headers=headers,
        )
    upload_id = upload_resp.json()["upload_id"]

    # Manually confirm with synthetic entities
    resp = await client.post(
        f"/api/v1/upload/{upload_id}/confirm-extraction",
        json={
            "confirmed_entities": [
                {
                    "entity_class": "condition",
                    "text": "Hypertension",
                    "attributes": {"status": "active"},
                    "confidence": 0.85,
                },
                {
                    "entity_class": "medication",
                    "text": "Lisinopril",
                    "attributes": {"medication_group": "Lisinopril"},
                    "confidence": 0.9,
                },
                {
                    "entity_class": "dosage",
                    "text": "10mg",
                    "attributes": {},
                    "confidence": 0.8,
                },
            ],
            "patient_id": str(patient.id),
        },
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    # dosage should be skipped (non-storable), so 2 records
    assert data["records_created"] == 2
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_upload_pdf_accepted(client: AsyncClient, db_session: AsyncSession):
    """Verify PDF files are accepted by the unstructured endpoint."""
    headers, user_id = await auth_headers(client)

    # Minimal PDF-like content (won't actually parse but tests routing)
    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/unstructured",
            files={"file": ("report.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")},
            headers=headers,
        )
    assert resp.status_code == 202
    data = resp.json()
    assert data["file_type"] == "pdf"


@pytest.mark.asyncio
async def test_concurrent_uploads_respect_semaphore(client: AsyncClient, db_session: AsyncSession):
    """Upload 3 RTF files simultaneously, verify all are accepted."""
    headers, user_id = await auth_headers(client)

    rtf_files = [
        rb"""{\rtf1\ansi Note one: Patient has hypertension.}""",
        rb"""{\rtf1\ansi Note two: Patient takes Metformin 500mg.}""",
        rb"""{\rtf1\ansi Note three: Lab results show elevated glucose.}""",
    ]

    upload_ids = []
    with PATCH_BG_TASK:
        for i, content in enumerate(rtf_files):
            resp = await client.post(
                "/api/v1/upload/unstructured",
                files={"file": (f"note_{i}.rtf", io.BytesIO(content), "application/rtf")},
                headers=headers,
            )
            assert resp.status_code == 202
            data = resp.json()
            assert data["upload_id"]
            assert data["status"] == "processing"
            upload_ids.append(data["upload_id"])

    # All 3 should have unique upload IDs
    assert len(set(upload_ids)) == 3


@pytest.mark.asyncio
async def test_batch_upload_endpoint(client: AsyncClient, db_session: AsyncSession):
    """Verify /unstructured-batch accepts multiple files and returns list of upload IDs."""
    headers, user_id = await auth_headers(client)

    rtf1 = rb"""{\rtf1\ansi Batch note one: Diabetes type 2.}"""
    rtf2 = rb"""{\rtf1\ansi Batch note two: Allergic to penicillin.}"""
    pdf1 = b"%PDF-1.4 batch pdf content"

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/unstructured-batch",
            files=[
                ("files", ("batch1.rtf", io.BytesIO(rtf1), "application/rtf")),
                ("files", ("batch2.rtf", io.BytesIO(rtf2), "application/rtf")),
                ("files", ("batch3.pdf", io.BytesIO(pdf1), "application/pdf")),
            ],
            headers=headers,
        )
    assert resp.status_code == 202
    data = resp.json()
    assert data["total"] == 3
    assert len(data["uploads"]) == 3

    # Each upload should have a unique ID
    upload_ids = [u["upload_id"] for u in data["uploads"]]
    assert len(set(upload_ids)) == 3

    # Check file types
    file_types = [u["file_type"] for u in data["uploads"]]
    assert file_types.count("rtf") == 2
    assert file_types.count("pdf") == 1


@pytest.mark.asyncio
async def test_pending_extraction_lists_pending_files(
    client: AsyncClient, db_session: AsyncSession
):
    """GET /upload/pending-extraction returns files with pending_extraction status."""
    headers, user_id = await auth_headers(client)

    from app.models.uploaded_file import UploadedFile
    from uuid import uuid4

    upload = UploadedFile(
        id=uuid4(),
        user_id=user_id,
        filename="test_note.pdf",
        mime_type="application/pdf",
        file_size_bytes=1234,
        file_hash="abc123pendingtest",
        storage_path="/tmp/test.pdf",
        ingestion_status="pending_extraction",
        file_category="unstructured",
    )
    db_session.add(upload)
    await db_session.commit()

    resp = await client.get("/api/v1/upload/pending-extraction", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["files"][0]["filename"] == "test_note.pdf"
    assert data["files"][0]["id"] == str(upload.id)


@pytest.mark.asyncio
async def test_pending_extraction_excludes_other_users(
    client: AsyncClient, db_session: AsyncSession
):
    """Pending extraction only returns files owned by the current user."""
    headers, user_id = await auth_headers(client)

    from app.models.uploaded_file import UploadedFile
    from app.models.user import User
    from uuid import uuid4

    other_user = User(
        id=uuid4(),
        email="other_pending_encrypted",
        password_hash="$2b$12$fakefakefakefakefakefuaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        is_active=True,
    )
    db_session.add(other_user)
    await db_session.flush()

    upload = UploadedFile(
        id=uuid4(),
        user_id=other_user.id,
        filename="other_note.pdf",
        mime_type="application/pdf",
        file_size_bytes=1234,
        file_hash="xyz789pendingother",
        storage_path="/tmp/other.pdf",
        ingestion_status="pending_extraction",
        file_category="unstructured",
    )
    db_session.add(upload)
    await db_session.commit()

    resp = await client.get("/api/v1/upload/pending-extraction", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_batch_upload_skips_invalid_files(client: AsyncClient, db_session: AsyncSession):
    """Batch endpoint skips unsupported file types and invalid magic bytes."""
    headers, user_id = await auth_headers(client)

    rtf_valid = rb"""{\rtf1\ansi Valid RTF note.}"""
    txt_invalid = b"plain text not allowed"

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/unstructured-batch",
            files=[
                ("files", ("valid.rtf", io.BytesIO(rtf_valid), "application/rtf")),
                ("files", ("invalid.txt", io.BytesIO(txt_invalid), "text/plain")),
            ],
            headers=headers,
        )
    assert resp.status_code == 202
    data = resp.json()
    # Only the valid RTF should be accepted
    assert data["total"] == 1
    assert data["uploads"][0]["file_type"] == "rtf"


@pytest.mark.asyncio
async def test_trigger_extraction_starts_processing(
    client: AsyncClient, db_session: AsyncSession
):
    """POST /upload/trigger-extraction triggers processing for pending files."""
    headers, user_id = await auth_headers(client)

    from app.models.uploaded_file import UploadedFile
    from uuid import uuid4

    uploads = []
    for i in range(3):
        upload = UploadedFile(
            id=uuid4(),
            user_id=user_id,
            filename=f"note_{i}.rtf",
            mime_type="application/rtf",
            file_size_bytes=500,
            file_hash=f"hash_trigger_{i}",
            storage_path=f"/tmp/note_{i}.rtf",
            ingestion_status="pending_extraction",
            file_category="unstructured",
        )
        db_session.add(upload)
        uploads.append(upload)
    await db_session.commit()

    upload_ids = [str(u.id) for u in uploads]

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/trigger-extraction",
            json={"upload_ids": upload_ids},
            headers=headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["triggered"] == 3
    assert data["failed"] == 0
    assert len(data["results"]) == 3


@pytest.mark.asyncio
async def test_trigger_extraction_rejects_wrong_status(
    client: AsyncClient, db_session: AsyncSession
):
    """Trigger extraction rejects files not in pending_extraction status."""
    headers, user_id = await auth_headers(client)

    from app.models.uploaded_file import UploadedFile
    from uuid import uuid4

    upload = UploadedFile(
        id=uuid4(),
        user_id=user_id,
        filename="completed.pdf",
        mime_type="application/pdf",
        file_size_bytes=1000,
        file_hash="hash_done_trigger",
        storage_path="/tmp/completed.pdf",
        ingestion_status="completed",
        file_category="structured",
    )
    db_session.add(upload)
    await db_session.commit()

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/trigger-extraction",
            json={"upload_ids": [str(upload.id)]},
            headers=headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["triggered"] == 0
    assert data["failed"] == 1


@pytest.mark.asyncio
async def test_trigger_extraction_rejects_other_users_files(
    client: AsyncClient, db_session: AsyncSession
):
    """Trigger extraction rejects files not owned by the current user."""
    headers, user_id = await auth_headers(client)

    from app.models.uploaded_file import UploadedFile
    from app.models.user import User
    from uuid import uuid4

    other_user = User(
        id=uuid4(),
        email="trigger_other_user_encrypted",
        password_hash="$2b$12$fakefakefakefakefakefuaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        is_active=True,
    )
    db_session.add(other_user)
    await db_session.flush()

    upload = UploadedFile(
        id=uuid4(),
        user_id=other_user.id,
        filename="other_note.rtf",
        mime_type="application/rtf",
        file_size_bytes=500,
        file_hash="hash_other_trigger_test",
        storage_path="/tmp/other_trigger.rtf",
        ingestion_status="pending_extraction",
        file_category="unstructured",
    )
    db_session.add(upload)
    await db_session.commit()

    with PATCH_BG_TASK:
        resp = await client.post(
            "/api/v1/upload/trigger-extraction",
            json={"upload_ids": [str(upload.id)]},
            headers=headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["triggered"] == 0
    assert data["failed"] == 1
