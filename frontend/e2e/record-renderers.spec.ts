import { test, expect } from "@playwright/test";
import { getTestAuth, authHeaders, type AuthContext } from "./helpers/auth";
import { seedTestData, type SeededData } from "./helpers/seed";

const API_BASE = "http://localhost:8000/api/v1";

let auth: AuthContext;
let seeded: SeededData;

test.beforeAll(async () => {
  auth = await getTestAuth();
  seeded = await seedTestData(auth);
});

// Helper: fetch a record's HTML by navigating to its detail page
async function verifyRecordType(
  page: import("@playwright/test").Page,
  recordType: string,
  assertions: (page: import("@playwright/test").Page) => Promise<void>
) {
  const ids = seeded.recordsByType[recordType];
  if (!ids || ids.length === 0) {
    test.skip();
    return;
  }

  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "test-renderer@test.com");
  await page.fill('input[name="password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(home|admin|dashboard)/);

  // Navigate to record page
  await page.goto(`/records/${ids[0]}`);
  await page.waitForSelector("h1, [data-testid='record-title']", { timeout: 10_000 });

  await assertions(page);
}

test.describe("Type-specific Renderers", () => {
  test("Condition: shows clinical status badge", async ({ page }) => {
    await verifyRecordType(page, "condition", async (p) => {
      // Should have a clinical status indicator (active/resolved/inactive)
      const statusText = p.locator("text=/active|resolved|inactive/i");
      await expect(statusText.first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test("Lab Observation: displays large numeric value", async ({ page }) => {
    await verifyRecordType(page, "observation", async (p) => {
      // Should have a large VT323 value display
      const largeValue = p.locator("[style*='VT323']");
      await expect(largeValue.first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test("Medication: shows dosage info", async ({ page }) => {
    await verifyRecordType(page, "medication", async (p) => {
      // Should show medication name and dosage strip
      const content = await p.textContent("body");
      expect(content).toMatch(/metformin|dosage|oral|prescriber|dr\./i);
    });
  });

  test("Encounter: shows department and provider", async ({ page }) => {
    await verifyRecordType(page, "encounter", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/department|provider|dr\./i);
    });
  });

  test("Immunization: shows vaccine name", async ({ page }) => {
    await verifyRecordType(page, "immunization", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/covid|vaccine|lot/i);
    });
  });

  test("Allergy: shows severity indicator and reactions", async ({ page }) => {
    await verifyRecordType(page, "allergy", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/penicillin|hives|severe/i);
    });
  });

  test("Procedure: shows procedure name and status", async ({ page }) => {
    await verifyRecordType(page, "procedure", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/appendectomy|completed/i);
    });
  });

  test("Service Request: shows provider flow", async ({ page }) => {
    await verifyRecordType(page, "service_request", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/referral|cardiology|dr\./i);
    });
  });

  test("Document: shows document type and author", async ({ page }) => {
    await verifyRecordType(page, "document", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/progress note|author|dr\./i);
    });
  });

  test("Diagnostic Report: shows conclusion", async ({ page }) => {
    await verifyRecordType(page, "diagnostic_report", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/conclusion|normal limits|blood count/i);
    });
  });

  test("Imaging: shows modality badges", async ({ page }) => {
    await verifyRecordType(page, "imaging", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/CT|X-Ray|abdomen/i);
    });
  });

  test("Care Plan: shows activity checklist", async ({ page }) => {
    await verifyRecordType(page, "care_plan", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/diabetes management|metformin|exercise/i);
    });
  });

  test("Communication: shows message content", async ({ page }) => {
    await verifyRecordType(page, "communication", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/lab results|follow-up/i);
    });
  });

  test("Appointment: shows time and participants", async ({ page }) => {
    await verifyRecordType(page, "appointment", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/diabetes follow-up|dr\. smith|participant/i);
    });
  });

  test("Care Team: shows member list", async ({ page }) => {
    await verifyRecordType(page, "care_team", async (p) => {
      const content = await p.textContent("body");
      expect(content).toMatch(/diabetes care team|dr\. smith|dietitian/i);
    });
  });
});
