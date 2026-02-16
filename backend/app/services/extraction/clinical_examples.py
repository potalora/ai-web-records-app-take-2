from __future__ import annotations

import langextract as lx

CLINICAL_EXTRACTION_PROMPT = """Extract clinical entities from medical text in order of appearance.
Entity types: medication, dosage, route, frequency, condition, lab_result, vital, procedure, allergy, provider, duration.

Use exact text from the input. Do not paraphrase.
Use attributes to group related entities (e.g. medication_group for drug details).
For lab results, include value, unit, and reference range as attributes when available.
For conditions, include status (active, resolved, historical) as an attribute.
IMPORTANT: For ALL entity types, include a "date" attribute when a date is mentioned or can be inferred from context (e.g. note date, visit date, order date). Use the format found in the text.

CRITICAL: Only extract conditions that DIRECTLY APPLY TO THIS PATIENT.
Do NOT extract conditions from:
- Educational text ("can cause", "may develop", "is associated with")
- Disease descriptions or informational paragraphs
- Differential diagnosis lists unless explicitly attributed to the patient

NEGATION: Do NOT extract negated findings as positive conditions.
Phrases like "No X", "denies X", "negative for X", "ruled out X", "absence of X"
mean the condition is NOT present. Either skip these entirely or set status="negated".

FAMILY HISTORY: Conditions belonging to family members (e.g., "Father has X",
"Family history of X", "Mother with X") must NOT be extracted as patient conditions.
Skip family history conditions entirely.

For each entity, include a "confidence" attribute (0.0-1.0):
- High (>0.8): Exact text match, clear clinical meaning
- Medium (0.5-0.8): Requires context interpretation
- Low (<0.5): Ambiguous or uncertain"""

CLINICAL_EXAMPLES = [
    lx.data.ExampleData(
        text="Patient was given 250 mg IV Cefazolin TID for one week. History of hypertension, controlled. BP 120/80 mmHg. Dr. Smith, Cardiology.",
        extractions=[
            lx.data.Extraction(
                extraction_class="dosage",
                extraction_text="250 mg",
                attributes={"medication_group": "Cefazolin", "value": "250", "unit": "mg"},
            ),
            lx.data.Extraction(
                extraction_class="route",
                extraction_text="IV",
                attributes={"medication_group": "Cefazolin", "full_name": "intravenous"},
            ),
            lx.data.Extraction(
                extraction_class="medication",
                extraction_text="Cefazolin",
                attributes={"medication_group": "Cefazolin", "drug_class": "antibiotic", "confidence": "0.95"},
            ),
            lx.data.Extraction(
                extraction_class="frequency",
                extraction_text="TID",
                attributes={"medication_group": "Cefazolin", "meaning": "three times daily"},
            ),
            lx.data.Extraction(
                extraction_class="duration",
                extraction_text="for one week",
                attributes={"medication_group": "Cefazolin", "days": "7"},
            ),
            lx.data.Extraction(
                extraction_class="condition",
                extraction_text="hypertension",
                attributes={"status": "active", "controlled": "true", "confidence": "0.90"},
            ),
            lx.data.Extraction(
                extraction_class="vital",
                extraction_text="BP 120/80 mmHg",
                attributes={"type": "blood_pressure", "systolic": "120", "diastolic": "80", "unit": "mmHg"},
            ),
            lx.data.Extraction(
                extraction_class="provider",
                extraction_text="Dr. Smith",
                attributes={"specialty": "Cardiology", "role": "attending"},
            ),
        ],
    ),
    lx.data.ExampleData(
        text="HbA1c 6.8% (ref 4.0-5.6). Metformin 500mg PO BID for type 2 diabetes. Allergic to Penicillin (rash). Colonoscopy performed 01/2024.",
        extractions=[
            lx.data.Extraction(
                extraction_class="lab_result",
                extraction_text="HbA1c 6.8%",
                attributes={"test": "HbA1c", "value": "6.8", "unit": "%", "ref_low": "4.0", "ref_high": "5.6", "interpretation": "high", "confidence": "0.95"},
            ),
            lx.data.Extraction(
                extraction_class="medication",
                extraction_text="Metformin",
                attributes={"medication_group": "Metformin"},
            ),
            lx.data.Extraction(
                extraction_class="dosage",
                extraction_text="500mg",
                attributes={"medication_group": "Metformin", "value": "500", "unit": "mg"},
            ),
            lx.data.Extraction(
                extraction_class="route",
                extraction_text="PO",
                attributes={"medication_group": "Metformin", "full_name": "oral"},
            ),
            lx.data.Extraction(
                extraction_class="frequency",
                extraction_text="BID",
                attributes={"medication_group": "Metformin", "meaning": "twice daily"},
            ),
            lx.data.Extraction(
                extraction_class="condition",
                extraction_text="type 2 diabetes",
                attributes={"status": "active"},
            ),
            lx.data.Extraction(
                extraction_class="allergy",
                extraction_text="Penicillin",
                attributes={"reaction": "rash", "severity": "mild"},
            ),
            lx.data.Extraction(
                extraction_class="procedure",
                extraction_text="Colonoscopy",
                attributes={"date": "01/2024"},
            ),
        ],
    ),
    lx.data.ExampleData(
        text="No chest pain. Denies shortness of breath. History of diabetes, controlled. Family history of heart disease (father).",
        extractions=[
            # chest pain: SKIPPED (negated)
            # shortness of breath: SKIPPED (negated)
            lx.data.Extraction(
                extraction_class="condition",
                extraction_text="diabetes",
                attributes={"status": "active", "controlled": "true", "date": ""},
            ),
            # heart disease: SKIPPED (family history, not patient's)
        ],
    ),
]
