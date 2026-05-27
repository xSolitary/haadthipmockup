import { expect, test, type Page } from "@playwright/test";

const accounts = {
  requester: { username: "requester", password: "demo123" },
  approver: { username: "approver", password: "demo123" },
  purchasing: { username: "purchasing", password: "demo123" },
  vendor: { username: "vendor", password: "demo123" },
} as const;

const deliveryStatuses = [
  "รับคำสั่งซื้อแล้ว",
  "กำลังเตรียมสินค้า",
  "อยู่ระหว่างจัดส่ง",
  "จัดส่งถึงปลายทางแล้ว",
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
});

test("full procurement workflow completes across requester, approver, purchasing, vendor, and receiving", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const uniqueTitle = `E2E Memo ${Date.now()}`;
  let memoId = "";
  let memoNumber = "";
  let poId = "";
  let prNumber = "";
  let selectedVendorName = "";

  await login(page, accounts.requester.username, accounts.requester.password, "/");
  await assertRoleMenu(page, "requester");
  await openWorkspace(page, "ระบบจัดซื้อ", /\/my-requests/);
  await expect(page.getByTestId("procure-tab-memo")).toBeVisible();
  await expect(page.getByTestId("create-memo-link")).toBeVisible();
  await page.getByTestId("create-memo-link").click();

  const titleInput = page.locator('label:has-text("หัวข้อ Memo") input').first();
  if ((await titleInput.inputValue()).trim() === "") {
    await page.getByTestId("memo-autofill-button").click();
  }
  await titleInput.fill(uniqueTitle);

  await page.getByTestId("memo-submit-button").click();
  await confirmDialog(page, "ยืนยันสร้าง Memo?", "ยืนยันสร้าง Memo");
  await closeSuccessDialog(page, "สร้าง Memo สำเร็จ");

  const requesterMemoRow = page.locator('[data-testid^="memo-row-"]').filter({ hasText: uniqueTitle }).first();
  await expect(requesterMemoRow).toBeVisible();
  memoId = getEntityIdFromTestId((await requesterMemoRow.getAttribute("data-testid")) ?? "", "memo-row-");
  await expect(requesterMemoRow).toContainText(uniqueTitle);
  await expect(requesterMemoRow).toContainText("รออนุมัติ");
  memoNumber = (await requesterMemoRow.locator("td").first().innerText()).trim();
  await logout(page);

  await login(page, accounts.approver.username, accounts.approver.password, "/");
  await assertRoleMenu(page, "approver");
  await openWorkspace(page, "ระบบจัดซื้อ", /\/my-requests/);
  const approverMemoRow = page.getByTestId(`memo-row-${memoId}`);
  await expect(approverMemoRow).toContainText(memoNumber);
  await page.getByTestId(`memo-action-${memoId}`).click();
  await expect(page).toHaveURL(new RegExp(`/memo/${memoId}/action$`));
  await page.getByRole("button", { name: "อนุมัติ", exact: true }).click();
  await confirmDialog(page, "ยืนยันอนุมัติ Memo?", "อนุมัติ");
  await closeSuccessDialog(page, "อนุมัติ Memo สำเร็จ");
  await logout(page);

  await login(page, accounts.purchasing.username, accounts.purchasing.password, "/");
  await assertRoleMenu(page, "purchasing");
  await openWorkspace(page, "ระบบจัดซื้อ", /\/my-requests/);
  await page.getByTestId("procure-tab-pr").click();
  const purchasingPrRow = page.locator('[data-testid^="pr-row-"]').filter({ hasText: uniqueTitle }).first();
  await expect(purchasingPrRow).toBeVisible();
  await expect(purchasingPrRow).toContainText("รอฝ่ายจัดซื้อเสนอ Vendor");
  poId = getEntityIdFromTestId((await purchasingPrRow.getAttribute("data-testid")) ?? "", "pr-row-");
  prNumber = (await purchasingPrRow.locator("td").first().innerText()).trim();

  await page.getByTestId(`pr-action-${poId}`).click();
  await expect(page).toHaveURL(new RegExp(`/pr-po/${poId}/action$`));
  if ((await page.locator('[data-testid^="vendor-proposal-card-"]').count()) === 0) {
    await page.getByTestId("vendor-proposal-autofill-button").click();
  }

  const proposalCards = page.locator('[data-testid^="vendor-proposal-card-"]');
  await expect(proposalCards).toHaveCount(4);

  const firstProposalCard = proposalCards.first();
  const secondProposalCard = proposalCards.nth(1);
  selectedVendorName = (await firstProposalCard.locator("p.text-lg.font-semibold").innerText()).trim();

  await firstProposalCard.locator('input[type="checkbox"]').check();
  await secondProposalCard.locator('input[type="checkbox"]').check();
  await page.getByTestId("submit-selected-vendors-button").click();
  await confirmDialog(page, "ยืนยันส่งให้หัวหน้าอนุมัติ?", "ส่งอนุมัติ");
  await closeSuccessDialog(page, "เลือก Vendor สำเร็จ");
  await expect(page.getByTestId(`pr-row-${poId}`)).toContainText("รออนุมัติการเลือก Vendor");
  await logout(page);

  await login(page, accounts.approver.username, accounts.approver.password, "/");
  await assertRoleMenu(page, "approver");
  await openWorkspace(page, "ระบบจัดซื้อ", /\/my-requests/);
  await page.getByTestId("procure-tab-pr").click();
  const approverPrRow = page.getByTestId(`pr-row-${poId}`);
  await expect(approverPrRow).toContainText(prNumber);
  await page.getByTestId(`pr-action-${poId}`).click();
  await expect(page).toHaveURL(new RegExp(`/pr-po/${poId}/action$`));

  const submittedProposalCard = page.locator('[data-testid^="vendor-proposal-card-"]').filter({ hasText: selectedVendorName }).first();
  await expect(submittedProposalCard).toBeVisible();
  await submittedProposalCard.getByRole("button", { name: "ยืนยัน Vendor" }).click();
  await confirmDialog(page, "ยืนยันการเลือก Vendor?", "ยืนยัน Vendor");
  await closeSuccessDialog(page, "ยืนยัน Vendor สำเร็จ");
  await logout(page);

  await login(page, accounts.vendor.username, accounts.vendor.password, "/my-requests?tab=po");
  await assertRoleMenu(page, "vendor");
  await expect(page.getByTestId("procure-tab-po")).toBeVisible();
  await expect(page.getByTestId("procure-tab-memo")).toHaveCount(0);
  await expect(page.getByTestId("procure-tab-pr")).toHaveCount(0);
  await expect(page.getByTestId(`po-row-${poId}`)).toContainText(selectedVendorName);

  for (const status of deliveryStatuses.slice(0, 3)) {
    await openVendorDeliveryAction(page, poId);
    await updateDeliveryStatus(page, status, `TRACK-${Date.now()}`, `สถานะ ${status}`);
  }
  await logout(page);

  await login(page, accounts.purchasing.username, accounts.purchasing.password, "/");
  await assertRoleMenu(page, "purchasing");
  await openWorkspace(page, "ตรวจรับสินค้า", /\/receiving/);
  await page.getByTestId(`receiving-po-${poId}`).click();
  await expect(page.getByTestId("receive-goods-button")).toBeDisabled();
  await logout(page);

  await login(page, accounts.vendor.username, accounts.vendor.password, "/my-requests?tab=po");
  await assertRoleMenu(page, "vendor");
  await openVendorDeliveryAction(page, poId);
  await updateDeliveryStatus(
    page,
    "จัดส่งถึงปลายทางแล้ว",
    `TRACK-${Date.now()}`,
    "ส่งถึงปลายทางเรียบร้อยแล้ว",
  );
  await expect(page.getByTestId(`po-row-${poId}`)).toContainText("จัดส่งถึงปลายทางแล้ว");
  await logout(page);

  await login(page, accounts.purchasing.username, accounts.purchasing.password, "/");
  await assertRoleMenu(page, "purchasing");
  await openWorkspace(page, "ตรวจรับสินค้า", /\/receiving/);
  await page.getByTestId(`receiving-po-${poId}`).click();
  await expect(page.getByTestId("receive-goods-button")).toBeEnabled();
  await expect(page.locator("body")).toContainText("จัดส่งถึงปลายทางแล้ว");

  const receivedQtyInput = page.locator('label:has-text("จำนวนที่รับ") input');
  await receivedQtyInput.fill("10");
  await page.getByTestId("receive-goods-button").click();
  await confirmDialog(page, "ยืนยันรับสินค้า?", "ยืนยันรับสินค้า");
  await closeSuccessDialog(page, "รับสินค้าสำเร็จ");

  await expect(page.getByTestId("mark-qc-passed-button")).toBeVisible();
  await page.getByTestId("mark-qc-passed-button").click();
  await closeSuccessDialog(page, "ยืนยัน QC สำเร็จ");

  await expect(page.locator("body")).toContainText("ผ่าน QC");
  await expect(page.locator("body")).toContainText("QC Passed");

  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
});

async function login(page: Page, username: string, password: string, expectedPath: string) {
  await page.goto("/login");
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect
    .poll(() => {
      const url = new URL(page.url());
      return `${url.pathname}${url.search}`;
    })
    .toBe(expectedPath);
}

async function logout(page: Page) {
  await page.locator('button[aria-haspopup="menu"]:not(#next-logo)').click();
  await page.getByText("ออกจากระบบ", { exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
}

async function assertRoleMenu(page: Page, role: "requester" | "approver" | "purchasing" | "vendor") {
  if (role === "vendor") {
    await expect(page.getByRole("link", { name: "PO / งานจัดส่ง" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ตรวจรับสินค้า" }).first()).toBeVisible();
    return;
  }

  await expect(page.getByRole("link", { name: "ระบบจัดซื้อ" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "ตรวจรับสินค้า" }).first()).toBeVisible();
}

async function confirmDialog(page: Page, title: string, confirmLabel: string) {
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: confirmLabel, exact: true }).click();
}

async function closeSuccessDialog(page: Page, title: string) {
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "ตกลง", exact: true }).click();
}

async function openVendorDeliveryAction(page: Page, poId: string) {
  await page.goto("/my-requests?tab=po");
  await expect(page.getByTestId(`po-row-${poId}`)).toBeVisible();
  await page.getByTestId(`po-action-${poId}`).click();
  await expect(page).toHaveURL(new RegExp(`/pr-po/${poId}/action$`));
}

async function updateDeliveryStatus(page: Page, status: (typeof deliveryStatuses)[number], trackingNumber: string, note: string) {
  const poIdMatch = page.url().match(/\/pr-po\/([^/]+)\/action$/);
  if (!poIdMatch) {
    throw new Error(`Unexpected vendor delivery URL: ${page.url()}`);
  }
  const poId = poIdMatch[1];
  await page.getByTestId(`delivery-status-${status}`).dispatchEvent("click");
  await page.getByLabel("Tracking Number").fill(trackingNumber);
  await page.getByLabel("Expected Delivery Date").fill(nextDateString(5));
  await page.locator('label:has-text("หมายเหตุ") textarea').fill(note);
  await page.getByTestId("save-delivery-status-button").dispatchEvent("click");
  const successDialog = page.getByRole("dialog", { name: "อัปเดตสถานะสำเร็จ" });
  await expect(successDialog).toBeVisible();
  await successDialog.getByRole("button", { name: "ตกลง", exact: true }).dispatchEvent("click");
  await expect(page).toHaveURL(/\/my-requests\?tab=po(?:&highlightId=.*)?$/);
  await expect(page.getByTestId(`po-row-${poId}`)).toContainText(status);
}

async function openWorkspace(page: Page, linkName: string, expectedUrl: RegExp) {
  await page.getByRole("link", { name: linkName }).first().click();
  await expect(page).toHaveURL(expectedUrl);
}

function getEntityIdFromTestId(value: string, prefix: string) {
  if (!value.startsWith(prefix)) {
    throw new Error(`Unexpected test id: ${value}`);
  }

  return value.slice(prefix.length);
}

function nextDateString(daysAhead: number) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysAhead);
  return nextDate.toISOString().slice(0, 10);
}
