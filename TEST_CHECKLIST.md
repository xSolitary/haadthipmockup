# Manual Test Checklist

## How To Tell A Script Passed

- [ ] คำสั่งรันจบและกลับมาที่ terminal prompt ตามปกติ
- [ ] ใน PowerShell ค่า `$LASTEXITCODE` เป็น `0`
- [ ] สรุปท้ายผลลัพธ์มีคำว่า `passed` และไม่มี `failed` หรือ `Error`

## Environment

- [p] `npm install` completes successfully.
- [p] `npm run build` completes successfully.
- [p] Thai UI text renders correctly in the browser with no mojibake such as `à¸` or `à¹`.

## Login Flows

- [p] Requester login works with `requester / demo123` and lands on `/`.
- [p] Approver login works with `approver / demo123` and lands on `/`.
- [p] Purchasing login works with `purchasing / demo123` and lands on `/`.
- [p] Vendor login works with `vendor / demo123` and lands on `/my-requests?tab=po`.
- [p] Admin login works with `admin / demo123` and lands on `/`.
- [p] After each login, the profile menu shows the correct `@username`.
- [p] Logout returns the session to the login screen.

## Unit-Tested Areas

- [ ] Role-based navigation visibility matches the logged-in role.
- [ ] Notification totals match the current role and current workflow state.
- [ ] Procure-to-Pay request filtering works for search and status filters.
- [ ] Procure-to-Pay request sorting works for date, document, status, and amount options.

## E2E Smoke

- [ ] `npm run test:unit` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `npm run test:e2e:ui` opens the Playwright UI runner.

