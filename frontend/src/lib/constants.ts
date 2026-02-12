export const APP_NAME = "MedTimeline";
export const APP_DESCRIPTION = "Personal Health Records Dashboard";

export const RECORD_TYPE_COLORS: Record<string, string> = {
  condition: "bg-amber-100 text-amber-800",
  observation: "bg-teal-100 text-teal-800",
  medication: "bg-violet-100 text-violet-800",
  allergy: "bg-red-100 text-red-800",
  procedure: "bg-blue-100 text-blue-800",
  encounter: "bg-emerald-100 text-emerald-800",
  immunization: "bg-indigo-100 text-indigo-800",
  imaging: "bg-cyan-100 text-cyan-800",
  document: "bg-gray-100 text-gray-800",
  diagnostic_report: "bg-orange-100 text-orange-800",
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
};
