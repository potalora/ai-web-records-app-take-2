import {
  Stethoscope,
  TestTube,
  HeartPulse,
  Pill,
  Building2,
  Shield,
  AlertTriangle,
  Scissors,
  ArrowRightLeft,
  FileText,
  ClipboardList,
  ScanLine,
  ListChecks,
  MessageSquare,
  CalendarClock,
  Users,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";

export const RECORD_TYPE_ICONS: Record<string, LucideIcon> = {
  condition: Stethoscope,
  observation: TestTube,
  medication: Pill,
  encounter: Building2,
  immunization: Shield,
  allergy: AlertTriangle,
  procedure: Scissors,
  service_request: ArrowRightLeft,
  document: FileText,
  diagnostic_report: ClipboardList,
  imaging: ScanLine,
  care_plan: ListChecks,
  communication: MessageSquare,
  appointment: CalendarClock,
  care_team: Users,
  questionnaire_response: FileQuestion,
  immunization_recommendation: Shield,
};

/** Get the observation-specific icon based on category */
export function getObservationIcon(fhirResource: Record<string, unknown>): LucideIcon {
  const categories = Array.isArray(fhirResource.category) ? fhirResource.category : [];
  for (const cat of categories) {
    const codings = Array.isArray((cat as Record<string, unknown>)?.coding)
      ? ((cat as Record<string, unknown>).coding as Record<string, unknown>[])
      : [];
    for (const coding of codings) {
      const code = String(coding?.code ?? "").toLowerCase();
      if (code === "vital-signs") return HeartPulse;
    }
    const text = String((cat as Record<string, unknown>)?.text ?? "").toLowerCase();
    if (text.includes("vital")) return HeartPulse;
  }
  return TestTube;
}
