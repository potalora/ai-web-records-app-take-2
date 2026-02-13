from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import pytest

from app.services.ingestion.fhir_parser import (
    extract_coding,
    extract_effective_date,
    extract_status,
    map_fhir_resource,
    build_display_text,
)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _load_sample_bundle() -> dict:
    return json.loads((FIXTURES_DIR / "sample_fhir_bundle.json").read_text())


class TestFHIRParser:
    """Unit tests for FHIR parser functions (no DB needed)."""

    def test_map_condition(self):
        """Map a Condition resource to health_records fields."""
        resource = {
            "resourceType": "Condition",
            "code": {
                "coding": [
                    {"system": "http://snomed.info/sct", "code": "44054006", "display": "Type 2 diabetes mellitus"}
                ]
            },
            "clinicalStatus": {"coding": [{"code": "active"}]},
            "onsetDateTime": "2020-03-15",
        }
        result = map_fhir_resource(resource)
        assert result is not None
        assert result["record_type"] == "condition"
        assert result["fhir_resource_type"] == "Condition"
        assert result["code_system"] == "http://snomed.info/sct"
        assert result["code_value"] == "44054006"
        assert result["code_display"] == "Type 2 diabetes mellitus"
        assert result["status"] == "active"
        assert result["effective_date"] is not None

    def test_map_observation(self):
        """Map an Observation resource."""
        resource = {
            "resourceType": "Observation",
            "status": "final",
            "code": {
                "coding": [
                    {"system": "http://loinc.org", "code": "4548-4", "display": "Hemoglobin A1c"}
                ]
            },
            "effectiveDateTime": "2024-01-10T10:30:00Z",
            "valueQuantity": {"value": 6.8, "unit": "%"},
        }
        result = map_fhir_resource(resource)
        assert result is not None
        assert result["record_type"] == "observation"
        assert result["code_system"] == "http://loinc.org"
        assert result["effective_date"] is not None

    def test_unsupported_resource_returns_none(self):
        """Unsupported resource types return None."""
        result = map_fhir_resource({"resourceType": "Organization"})
        assert result is None

    def test_patient_not_in_supported(self):
        """Patient resource type is not in SUPPORTED_RESOURCE_TYPES."""
        result = map_fhir_resource({"resourceType": "Patient"})
        assert result is None

    def test_extract_dates(self):
        """Extract dates from various FHIR date fields."""
        assert extract_effective_date({"effectiveDateTime": "2024-01-10T10:30:00Z"}) is not None
        assert extract_effective_date({"onsetDateTime": "2020-03-15"}) is not None
        assert extract_effective_date({"issued": "2024-01-10T10:30:00+00:00"}) is not None
        assert extract_effective_date({}) is None

    def test_extract_dates_period(self):
        """Extract dates from period fields."""
        resource = {"effectivePeriod": {"start": "2024-01-01", "end": "2024-01-05"}}
        assert extract_effective_date(resource) is not None

    def test_extract_coding(self):
        """Extract coding system, code, display."""
        resource = {
            "code": {
                "coding": [
                    {"system": "http://loinc.org", "code": "12345", "display": "Test"}
                ]
            }
        }
        system, code, display = extract_coding(resource)
        assert system == "http://loinc.org"
        assert code == "12345"
        assert display == "Test"

    def test_extract_coding_text_only(self):
        """Extract display from code.text when no coding array."""
        resource = {"code": {"text": "Some condition"}}
        system, code, display = extract_coding(resource)
        assert system is None
        assert code is None
        assert display == "Some condition"

    def test_extract_coding_no_code(self):
        """No code object returns all None."""
        system, code, display = extract_coding({})
        assert system is None and code is None and display is None

    def test_extract_status(self):
        """Extract status from different FHIR patterns."""
        assert extract_status({"status": "active"}) == "active"
        assert extract_status({"clinicalStatus": {"coding": [{"code": "active"}]}}) == "active"
        assert extract_status({}) is None

    def test_build_display_text_encounter(self):
        """Build display text for Encounter resource."""
        resource = {"type": [{"text": "Office visit"}], "class": {"code": "AMB"}}
        text = build_display_text(resource, "Encounter")
        assert "Office visit" in text

    def test_build_display_text_immunization(self):
        """Build display text for Immunization resource."""
        resource = {"vaccineCode": {"coding": [{"display": "Flu shot"}]}}
        text = build_display_text(resource, "Immunization")
        assert "Flu shot" in text

    def test_parse_bundle_entry_count(self):
        """Verify sample bundle has expected entries."""
        bundle = _load_sample_bundle()
        entries = bundle.get("entry", [])
        assert len(entries) == 3  # Patient + Condition + Observation

    def test_map_all_sample_entries(self):
        """Map all non-Patient entries from sample bundle."""
        bundle = _load_sample_bundle()
        mapped = []
        for entry in bundle.get("entry", []):
            resource = entry.get("resource")
            if resource and resource.get("resourceType") != "Patient":
                result = map_fhir_resource(resource)
                if result:
                    mapped.append(result)
        assert len(mapped) == 2
        types = {m["record_type"] for m in mapped}
        assert "condition" in types
        assert "observation" in types


class TestEpicFixtures:
    """Verify synthetic Epic TSV fixtures exist and have correct structure."""

    def test_epic_tsv_files_exist(self):
        """Sample Epic TSV directory has expected files."""
        tsv_dir = FIXTURES_DIR / "sample_epic_tsv"
        if not tsv_dir.exists():
            pytest.skip("No sample Epic TSV directory")
        expected = {"PATIENT.tsv", "PROBLEM_LIST.tsv", "ORDER_RESULTS.tsv",
                    "MEDICATIONS.tsv", "ENCOUNTERS.tsv", "ALLERGIES.tsv"}
        actual = {f.name for f in tsv_dir.glob("*.tsv")}
        assert expected.issubset(actual)

    def test_epic_tsv_has_headers(self):
        """Each Epic TSV file has a header row."""
        tsv_dir = FIXTURES_DIR / "sample_epic_tsv"
        if not tsv_dir.exists():
            pytest.skip("No sample Epic TSV directory")
        for tsv_path in tsv_dir.glob("*.tsv"):
            with open(tsv_path, "r", encoding="utf-8-sig") as f:
                header = f.readline().strip()
                assert len(header) > 0, f"Empty header in {tsv_path.name}"
                assert "\t" in header, f"No tab separator in {tsv_path.name} header"
