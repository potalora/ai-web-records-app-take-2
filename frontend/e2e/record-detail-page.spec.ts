import { test, expect, type Page } from "@playwright/test";
import { getTestAuth, type AuthContext } from "./helpers/auth";
import { seedTestData, type SeededData } from "./helpers/seed";

let auth: AuthContext;
let seeded: SeededData;

test.beforeAll(async () => {
  auth = await getTestAuth();
  seeded = await seedTestData(auth);
});

async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test-renderer@test.com");
  await page.fill('input[name="password"]', "TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(home|admin|dashboard)/);
}

test.describe("Record Detail Page (/records/[id])", () => {
  test("renders record with breadcrumb and icon", async ({ page }) => {
    await loginViaUI(page);

    // Get any record ID
    const types = Object.keys(seeded.recordsByType);
    const recordId = seeded.recordsByType[types[0]][0];

    await page.goto(`/records/${recordId}`);
    await page.waitForSelector("h1, [data-testid='record-title']", { timeout: 10_000 });

    // Breadcrumb
    await expect(page.getByText("Back to records")).toBeVisible();
  });

  test("has Advanced section that toggles JSON", async ({ page }) => {
    await loginViaUI(page);

    const types = Object.keys(seeded.recordsByType);
    const recordId = seeded.recordsByType[types[0]][0];

    await page.goto(`/records/${recordId}`);
    await page.waitForSelector("h1, [data-testid='record-title']", { timeout: 10_000 });

    // Advanced button should exist
    const advancedBtn = page.getByText("Advanced");
    await expect(advancedBtn).toBeVisible();

    // JSON not visible initially
    const jsonPre = page.locator("pre.json-syntax");
    await expect(jsonPre).not.toBeVisible();

    // Click to expand
    await advancedBtn.click();
    await expect(jsonPre).toBeVisible();
  });
});
