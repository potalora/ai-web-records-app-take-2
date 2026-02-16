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


class TestEpicMappers:
    """Unit tests for all Epic table mappers (no DB needed)."""

    def test_allergy_mapper(self):
        """AllergyMapper produces AllergyIntolerance."""
        from app.services.ingestion.epic_mappers.allergies import AllergyMapper

        mapper = AllergyMapper()
        row = {
            "ALLERGEN_ID_ALLERGEN_NAME": "Penicillin",
            "REACTION": "Hives",
            "DATE_NOTED": "3/15/2021 12:00:00 AM",
            "SEVERITY_C_NAME": "Severe",
            "ALRGY_STATUS_C_NAME": "Active",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "AllergyIntolerance"
        assert result["code"]["text"] == "Penicillin"
        assert result["reaction"][0]["manifestation"][0]["text"] == "Hives"
        assert result["reaction"][0]["severity"] == "severe"
        assert result["recordedDate"] is not None

    def test_allergy_mapper_empty_allergen_returns_none(self):
        """AllergyMapper returns None when allergen is empty."""
        from app.services.ingestion.epic_mappers.allergies import AllergyMapper

        mapper = AllergyMapper()
        assert mapper.to_fhir({"ALLERGEN_ID_ALLERGEN_NAME": ""}) is None

    def test_allergy_mapper_inactive_status(self):
        """AllergyMapper maps inactive status correctly."""
        from app.services.ingestion.epic_mappers.allergies import AllergyMapper

        mapper = AllergyMapper()
        row = {
            "ALLERGEN_ID_ALLERGEN_NAME": "Aspirin",
            "REACTION": "",
            "DATE_NOTED": "",
            "SEVERITY_C_NAME": "",
            "ALRGY_STATUS_C_NAME": "Inactive",
        }
        result = mapper.to_fhir(row)
        assert result["clinicalStatus"]["coding"][0]["code"] == "inactive"

    def test_immune_mapper(self):
        """ImmuneMapper produces Immunization."""
        from app.services.ingestion.epic_mappers.immunizations import ImmuneMapper

        mapper = ImmuneMapper()
        row = {
            "IMMUNZATN_ID_NAME": "COVID-19 Vaccine",
            "IMMUNE_DATE": "1/15/2021 12:00:00 AM",
            "DOSE": "0.3 mL",
            "ROUTE_C_NAME": "Intramuscular",
            "SITE_C_NAME": "Left Deltoid",
            "MFG_C_NAME": "Pfizer",
            "LOT": "EL9261",
            "IMMNZTN_STATUS_C_NAME": "Administered",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "Immunization"
        assert result["vaccineCode"]["text"] == "COVID-19 Vaccine"
        assert result["status"] == "completed"
        assert result["manufacturer"]["display"] == "Pfizer"
        assert result["lotNumber"] == "EL9261"
        assert result["route"]["text"] == "Intramuscular"

    def test_immune_mapper_empty_name_returns_none(self):
        """ImmuneMapper returns None when vaccine name is empty."""
        from app.services.ingestion.epic_mappers.immunizations import ImmuneMapper

        mapper = ImmuneMapper()
        assert mapper.to_fhir({"IMMUNZATN_ID_NAME": ""}) is None

    def test_order_proc_mapper(self):
        """OrderProcMapper produces Procedure."""
        from app.services.ingestion.epic_mappers.procedures import OrderProcMapper

        mapper = OrderProcMapper()
        row = {
            "DESCRIPTION": "CT Abdomen with Contrast",
            "ORDER_INST": "6/10/2023 12:00:00 AM",
            "ORDER_STATUS_C_NAME": "Completed",
            "AUTHRZING_PROV_ID_PROV_NAME": "Dr. Smith",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "Procedure"
        assert result["code"]["text"] == "CT Abdomen with Contrast"
        assert result["status"] == "completed"
        assert result["performer"][0]["actor"]["display"] == "Dr. Smith"

    def test_order_proc_mapper_pending_status(self):
        """OrderProcMapper maps pending status correctly."""
        from app.services.ingestion.epic_mappers.procedures import OrderProcMapper

        mapper = OrderProcMapper()
        row = {
            "DESCRIPTION": "MRI Brain",
            "ORDER_STATUS_C_NAME": "Pending",
        }
        result = mapper.to_fhir(row)
        assert result["status"] == "preparation"

    def test_vitals_mapper(self):
        """VitalsMapper produces Observation with vital-signs category."""
        from app.services.ingestion.epic_mappers.vitals import VitalsMapper

        mapper = VitalsMapper()
        row = {
            "FLO_MEAS_NAME": "Blood Pressure Systolic",
            "MEAS_VALUE": "120",
            "UNITS": "mmHg",
            "RECORDED_TIME": "2/15/2024 10:30:00 AM",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "Observation"
        assert result["category"][0]["coding"][0]["code"] == "vital-signs"
        assert result["valueQuantity"]["value"] == 120.0
        assert result["valueQuantity"]["unit"] == "mmHg"

    def test_vitals_mapper_string_value(self):
        """VitalsMapper handles non-numeric values."""
        from app.services.ingestion.epic_mappers.vitals import VitalsMapper

        mapper = VitalsMapper()
        row = {
            "FLO_MEAS_NAME": "Pain Scale",
            "MEAS_VALUE": "Moderate",
            "UNITS": "",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["valueString"] == "Moderate"

    def test_vitals_mapper_no_value_returns_none(self):
        """VitalsMapper returns None when value is missing."""
        from app.services.ingestion.epic_mappers.vitals import VitalsMapper

        mapper = VitalsMapper()
        assert mapper.to_fhir({"FLO_MEAS_NAME": "BP", "MEAS_VALUE": ""}) is None

    def test_referral_mapper(self):
        """ReferralMapper produces ServiceRequest."""
        from app.services.ingestion.epic_mappers.referrals import ReferralMapper

        mapper = ReferralMapper()
        row = {
            "REFERRING_PROV_ID_REFERRING_PROV_NAM": "Dr. Jones",
            "REFERRAL_PROV_ID_PROV_NAME": "Dr. Specialist",
            "RFL_STATUS_C_NAME": "Completed",
            "RSN_FOR_RFL_C_NAME": "Cardiology Consultation",
            "START_DATE": "3/1/2024 12:00:00 AM",
            "EXP_DATE": "6/1/2024 12:00:00 AM",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "ServiceRequest"
        assert result["code"]["text"] == "Cardiology Consultation"
        assert result["status"] == "completed"
        assert result["requester"]["display"] == "Dr. Jones"
        assert result["performer"][0]["display"] == "Dr. Specialist"

    def test_referral_mapper_no_reason_no_provider_returns_none(self):
        """ReferralMapper returns None when both reason and provider are empty."""
        from app.services.ingestion.epic_mappers.referrals import ReferralMapper

        mapper = ReferralMapper()
        assert mapper.to_fhir({
            "RSN_FOR_RFL_C_NAME": "",
            "REFERRAL_PROV_ID_PROV_NAME": "",
        }) is None

    def test_encounter_dx_mapper(self):
        """EncounterDxMapper produces Condition with encounter-diagnosis category."""
        from app.services.ingestion.epic_mappers.encounter_dx import EncounterDxMapper

        mapper = EncounterDxMapper()
        row = {
            "DX_ID_DX_NAME": "Acute Bronchitis",
            "CONTACT_DATE": "2/10/2024 12:00:00 AM",
            "PRIMARY_DX_YN": "Y",
            "ANNOTATION": "Follow-up in 2 weeks",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "Condition"
        assert result["code"]["text"] == "Acute Bronchitis"
        assert result["category"][0]["coding"][0]["code"] == "encounter-diagnosis"
        assert result["_primaryDiagnosis"] is True
        assert result["note"][0]["text"] == "Follow-up in 2 weeks"

    def test_encounter_dx_mapper_empty_dx_returns_none(self):
        """EncounterDxMapper returns None when dx name is empty."""
        from app.services.ingestion.epic_mappers.encounter_dx import EncounterDxMapper

        mapper = EncounterDxMapper()
        assert mapper.to_fhir({"DX_ID_DX_NAME": ""}) is None

    def test_social_hx_mapper(self):
        """SocialHxMapper produces Observation with social-history category."""
        from app.services.ingestion.epic_mappers.social_hx import SocialHxMapper

        mapper = SocialHxMapper()
        row = {
            "SOCIAL_HX_TYPE_C_NAME": "Tobacco Use",
            "SOCIAL_HX_COMMENT": "Former smoker, quit 2015",
            "CONTACT_DATE": "1/5/2024 12:00:00 AM",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "Observation"
        assert result["category"][0]["coding"][0]["code"] == "social-history"
        assert result["code"]["text"] == "Tobacco Use"
        assert result["valueString"] == "Former smoker, quit 2015"

    def test_social_hx_mapper_empty_returns_none(self):
        """SocialHxMapper returns None when all fields empty."""
        from app.services.ingestion.epic_mappers.social_hx import SocialHxMapper

        mapper = SocialHxMapper()
        assert mapper.to_fhir({}) is None

    def test_family_hx_mapper(self):
        """FamilyHxMapper produces FamilyMemberHistory."""
        from app.services.ingestion.epic_mappers.family_hx import FamilyHxMapper

        mapper = FamilyHxMapper()
        row = {
            "FAM_MEDICAL_DX_ID_DX_NAME": "Type 2 Diabetes",
            "RELATION_C_NAME": "Mother",
            "AGE_OF_ONSET": "55",
        }
        result = mapper.to_fhir(row)
        assert result is not None
        assert result["resourceType"] == "FamilyMemberHistory"
        assert result["relationship"]["text"] == "Mother"
        assert result["condition"][0]["code"]["text"] == "Type 2 Diabetes"
        assert result["condition"][0]["onsetAge"]["value"] == 55

    def test_family_hx_mapper_empty_dx_returns_none(self):
        """FamilyHxMapper returns None when dx name is empty."""
        from app.services.ingestion.epic_mappers.family_hx import FamilyHxMapper

        mapper = FamilyHxMapper()
        assert mapper.to_fhir({"FAM_MEDICAL_DX_ID_DX_NAME": ""}) is None

    def test_family_hx_mapper_non_numeric_onset(self):
        """FamilyHxMapper handles non-numeric age of onset."""
        from app.services.ingestion.epic_mappers.family_hx import FamilyHxMapper

        mapper = FamilyHxMapper()
        row = {
            "FAM_MEDICAL_DX_ID_DX_NAME": "Heart Disease",
            "RELATION_C_NAME": "Father",
            "AGE_OF_ONSET": "childhood",
        }
        result = mapper.to_fhir(row)
        assert result["condition"][0]["onsetString"] == "childhood"


class TestEpicMapperRegistration:
    """Verify all mappers are properly registered."""

    def test_all_mappers_registered(self):
        """All expected Epic table names have mappers."""
        from app.services.ingestion.epic_parser import EPIC_TABLE_MAPPERS

        expected_tables = {
            "PROBLEM_LIST", "PROBLEM_LIST_ALL", "MEDICAL_HX",
            "ORDER_MED", "ORDER_RESULTS", "PAT_ENC", "DOC_INFORMATION",
            "ALLERGY", "IMMUNE", "ORDER_PROC", "IP_FLWSHT_MEAS",
            "REFERRAL", "PAT_ENC_DX", "SOCIAL_HX", "FAMILY_HX",
        }
        assert expected_tables.issubset(set(EPIC_TABLE_MAPPERS.keys()))

    def test_record_type_map_includes_new_types(self):
        """RECORD_TYPE_MAP includes ServiceRequest and FamilyMemberHistory."""
        from app.services.ingestion.epic_parser import RECORD_TYPE_MAP

        assert "ServiceRequest" in RECORD_TYPE_MAP
        assert RECORD_TYPE_MAP["ServiceRequest"] == "service_request"
        assert "FamilyMemberHistory" in RECORD_TYPE_MAP
        assert RECORD_TYPE_MAP["FamilyMemberHistory"] == "condition"


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
