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

test.describe("Record Detail Sheet (Admin Drawer)", () => {
  test("opens drawer with record type icon and badge", async ({ page }) => {
    await loginViaUI(page);
    await page.goto("/admin?tab=all");
    await page.waitForSelector("[data-testid='record-row'], table tbody tr", {
      timeout: 10_000,
    });

    // Click the first record row
    const firstRow = page.locator("table tbody tr, [data-testid='record-row']").first();
    await firstRow.click();

    // Verify the sheet opened with key elements
    const sheet = page.locator("[role='dialog'], [data-state='open']");
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Should have "Record Details" header
    await expect(page.getByText("Record Details")).toBeVisible();
  });

  test("Advanced section is collapsed by default", async ({ page }) => {
    await loginViaUI(page);
    await page.goto("/admin?tab=all");
    await page.waitForSelector("table tbody tr", { timeout: 10_000 });

    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();

    const sheet = page.locator("[role='dialog'], [data-state='open']");
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Advanced button should be visible
    const advancedBtn = page.getByText("Advanced");
    await expect(advancedBtn).toBeVisible();

    // JSON should NOT be visible initially
    const jsonPre = sheet.locator("pre.json-syntax");
    await expect(jsonPre).not.toBeVisible();

    // Click Advanced to expand
    await advancedBtn.click();
    await expect(jsonPre).toBeVisible();
  });

  test("delete button is present", async ({ page }) => {
    await loginViaUI(page);
    await page.goto("/admin?tab=all");
    await page.waitForSelector("table tbody tr", { timeout: 10_000 });

    const firstRow = page.locator("table tbody tr").first();
    await firstRow.click();

    const sheet = page.locator("[role='dialog'], [data-state='open']");
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("Delete this record")).toBeVisible();
  });
});
