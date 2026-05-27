import { expect, test } from "@playwright/test";

const accounts = [
  { role: "requester", username: "requester", password: "demo123", pathname: "/", search: "" },
  { role: "approver", username: "approver", password: "demo123", pathname: "/", search: "" },
  { role: "purchasing", username: "purchasing", password: "demo123", pathname: "/", search: "" },
  { role: "vendor", username: "vendor", password: "demo123", pathname: "/my-requests", search: "?tab=po" },
  { role: "admin", username: "admin", password: "demo123", pathname: "/", search: "" },
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

for (const account of accounts) {
  test(`${account.role} can log in`, async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[autocomplete="username"]').fill(account.username);
    await page.locator('input[autocomplete="current-password"]').fill(account.password);
    await page.locator('button[type="submit"]').click();

    await expect
      .poll(() => {
        const url = new URL(page.url());
        return `${url.pathname}${url.search}`;
      })
      .toBe(`${account.pathname}${account.search}`);

    await page.locator('button[aria-haspopup="menu"]:not(#next-logo)').click();
    await expect(page.getByText(`@${account.username}`)).toBeVisible();
  });
}
