import { describe, expect, it } from "vitest";
import { canAccessPath, getDefaultRouteForRole, getNavItemsForRole } from "@/lib/route-access";

describe("route access", () => {
  it("returns vendor-only navigation for vendors", () => {
    expect(getNavItemsForRole("Vendor").map((item) => item.href)).toEqual([
      "/my-requests?tab=po",
      "/receiving",
    ]);
  });

  it("returns admin navigation including user management", () => {
    expect(getNavItemsForRole("Admin").map((item) => item.href)).toContain("/admin/users");
  });

  it("uses the vendor default route for vendor logins", () => {
    expect(getDefaultRouteForRole("Vendor")).toBe("/my-requests?tab=po");
    expect(getDefaultRouteForRole("Requester")).toBe("/");
  });

  it("restricts vendor paths to the vendor workflow", () => {
    expect(canAccessPath("Vendor", "/login")).toBe(true);
    expect(canAccessPath("Vendor", "/my-requests")).toBe(true);
    expect(canAccessPath("Vendor", "/receiving")).toBe(true);
    expect(canAccessPath("Vendor", "/pr-po/po-1/action")).toBe(true);
    expect(canAccessPath("Vendor", "/")).toBe(false);
    expect(canAccessPath("Vendor", "/reports")).toBe(false);
    expect(canAccessPath("Vendor", "/pr-po/po-1")).toBe(false);
  });
});
