import { test, expect } from "@playwright/test";
import { getTestAuth, type AuthContext } from "./helpers/auth";
import { seedTestData, type SeededData } from "./helpers/seed";

let auth: AuthContext;
let seeded: SeededData;

test.describe("E2E Setup", () => {
  test.beforeAll(async () => {
    auth = await getTestAuth();
    seeded = await seedTestData(auth);
  });

  test("test account is authenticated", () => {
    expect(auth.accessToken).toBeTruthy();
  });

  test("fixture data was uploaded and ingested", () => {
    expect(seeded.uploadId).toBeTruthy();
    expect(Object.keys(seeded.recordsByType).length).toBeGreaterThan(0);
  });

  test("multiple record types were created", () => {
    const types = Object.keys(seeded.recordsByType);
    // We expect at least conditions, observations, medications, encounters
    expect(types.length).toBeGreaterThanOrEqual(4);
  });
});
