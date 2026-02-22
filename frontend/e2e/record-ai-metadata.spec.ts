import { test, expect, type Page } from "@playwright/test";
import { getTestAuth, authHeaders, type AuthContext } from "./helpers/auth";

const API_BASE = "http://localhost:8000/api/v1";

let auth: AuthContext;

test.beforeAll(async () => {
  auth = await getTestAuth();
});

async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test-renderer@test.com");
  await page.fill('input[name="password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(home|admin|dashboard)/);
}

test.describe("AI Extraction Metadata Display", () => {
  test("non-AI records do not show AI badge", async ({ page }) => {
    await loginViaUI(page);

    // Fetch a regular record from the API
    const headers = authHeaders(auth.accessToken);
    const res = await fetch(`${API_BASE}/records?page_size=1`, { headers });
    const data = await res.json();

    if (data.items.length === 0) {
      test.skip();
      return;
    }

    const record = data.items[0];
    await page.goto(`/records/${record.id}`);
    await page.waitForSelector("h1, [data-testid='record-title']", { timeout: 10_000 });

    // If the record is not AI-extracted, the badge should not appear
    if (!record.ai_extracted) {
      const aiBadge = page.getByText("AI Extracted");
      await expect(aiBadge).not.toBeVisible();
    }
  });

  test("API returns ai_extracted and confidence_score fields", async () => {
    const headers = authHeaders(auth.accessToken);
    const res = await fetch(`${API_BASE}/records?page_size=1`, { headers });
    const data = await res.json();

    if (data.items.length === 0) {
      test.skip();
      return;
    }

    const record = data.items[0];
    expect("ai_extracted" in record).toBe(true);
    expect("confidence_score" in record).toBe(true);
    expect(typeof record.ai_extracted).toBe("boolean");
  });
});
