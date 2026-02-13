export const APP_NAME = "MedTimeline";
export const APP_DESCRIPTION = "Personal Health Records Dashboard";

export const RECORD_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  condition:         { bg: "var(--record-condition-bg)", text: "var(--record-condition-text)", dot: "var(--record-condition-dot)" },
  observation:       { bg: "var(--record-observation-bg)", text: "var(--record-observation-text)", dot: "var(--record-observation-dot)" },
  medication:        { bg: "var(--record-medication-bg)", text: "var(--record-medication-text)", dot: "var(--record-medication-dot)" },
  encounter:         { bg: "var(--record-encounter-bg)", text: "var(--record-encounter-text)", dot: "var(--record-encounter-dot)" },
  immunization:      { bg: "var(--record-immunization-bg)", text: "var(--record-immunization-text)", dot: "var(--record-immunization-dot)" },
  procedure:         { bg: "var(--record-procedure-bg)", text: "var(--record-procedure-text)", dot: "var(--record-procedure-dot)" },
  document:          { bg: "var(--record-document-bg)", text: "var(--record-document-text)", dot: "var(--record-document-dot)" },
  allergy:           { bg: "var(--record-allergy-bg)", text: "var(--record-allergy-text)", dot: "var(--record-allergy-dot)" },
  imaging:           { bg: "var(--record-imaging-bg)", text: "var(--record-imaging-text)", dot: "var(--record-imaging-dot)" },
  diagnostic_report: { bg: "var(--record-diagnostic_report-bg)", text: "var(--record-diagnostic_report-text)", dot: "var(--record-diagnostic_report-dot)" },
  service_request:   { bg: "var(--record-service_request-bg)", text: "var(--record-service_request-text)", dot: "var(--record-service_request-dot)" },
  communication:     { bg: "var(--record-communication-bg)", text: "var(--record-communication-text)", dot: "var(--record-communication-dot)" },
  appointment:       { bg: "var(--record-appointment-bg)", text: "var(--record-appointment-text)", dot: "var(--record-appointment-dot)" },
  care_plan:         { bg: "var(--record-care_plan-bg)", text: "var(--record-care_plan-text)", dot: "var(--record-care_plan-dot)" },
};

export const RECORD_TYPE_LABELS: Record<string, string> = {
  condition: "Conditions",
  observation: "Labs & Vitals",
  medication: "Medications",
  allergy: "Allergies",
  procedure: "Procedures",
  encounter: "Encounters",
  immunization: "Immunizations",
  imaging: "Imaging",
  document: "Documents",
  diagnostic_report: "Diagnostic Reports",
  service_request: "Service Requests",
  communication: "Communications",
  appointment: "Appointments",
  care_plan: "Care Plans",
};

export const RECORD_TYPE_SHORT: Record<string, string> = {
  condition: "COND",
  observation: "OBS",
  medication: "MED",
  encounter: "ENC",
  immunization: "IMMUN",
  procedure: "PROC",
  document: "DOC",
  allergy: "ALRG",
  imaging: "IMG",
  diagnostic_report: "DIAG",
  service_request: "SRVREQ",
  communication: "COMM",
  appointment: "APPT",
  care_plan: "CARE",
};

export const DEFAULT_RECORD_COLOR = { bg: "var(--record-default-bg)", text: "var(--record-default-text)", dot: "var(--record-default-dot)" };
