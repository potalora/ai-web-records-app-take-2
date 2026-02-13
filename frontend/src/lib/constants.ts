export const APP_NAME = "MedTimeline";
export const APP_DESCRIPTION = "Personal Health Records Dashboard";

export const RECORD_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  condition:         { bg: "#3d2e14", text: "#d4a843", dot: "#d4a843" },
  observation:       { bg: "#1e2e1a", text: "#7a8c5a", dot: "#7a8c5a" },
  medication:        { bg: "#2e1a14", text: "#c47a5a", dot: "#c47a5a" },
  encounter:         { bg: "#1a2e28", text: "#5a8c7a", dot: "#5a8c7a" },
  immunization:      { bg: "#2e2214", text: "#d49a40", dot: "#d49a40" },
  procedure:         { bg: "#1a2230", text: "#5a7a8c", dot: "#5a7a8c" },
  document:          { bg: "#252018", text: "#8a7a6a", dot: "#8a7a6a" },
  allergy:           { bg: "#301414", text: "#c45a3c", dot: "#c45a3c" },
  imaging:           { bg: "#28182e", text: "#8a5a7a", dot: "#8a5a7a" },
  diagnostic_report: { bg: "#2e2a14", text: "#c4a040", dot: "#c4a040" },
  service_request:   { bg: "#2e2214", text: "#d49a40", dot: "#d49a40" },
  communication:     { bg: "#252018", text: "#8a7a6a", dot: "#8a7a6a" },
  appointment:       { bg: "#1a2230", text: "#5a7a8c", dot: "#5a7a8c" },
  care_plan:         { bg: "#1e2e1a", text: "#7a8c5a", dot: "#7a8c5a" },
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

export const DEFAULT_RECORD_COLOR = { bg: "#252018", text: "#8a7a6a", dot: "#8a7a6a" };
