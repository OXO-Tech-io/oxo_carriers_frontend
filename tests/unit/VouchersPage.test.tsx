import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import VouchersPage from "@/app/(dashboard)/vouchers/page";
import { VoucherPaymentStatus, VoucherStatus } from "@/types";

const { apiMock, useAuthMock, searchParamsRef } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
  useAuthMock: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParamsRef.current }));
vi.mock("@/components/modals/CreateVoucherModal", () => ({ default: () => null }));

const roles = {
  executive: { user: { id: 1 }, isFinanceExecutive: true, isFinanceManager: false, isSuperAdmin: false },
  manager: { user: { id: 2 }, isFinanceExecutive: false, isFinanceManager: true, isSuperAdmin: false },
  admin: { user: { id: 3 }, isFinanceExecutive: false, isFinanceManager: false, isSuperAdmin: true },
};

const voucher = (id: number, status: VoucherStatus, extra: Record<string, unknown> = {}) => ({
  id,
  voucher_number: `VOU-2026-000${id}`,
  amount: 1000,
  vat: 0,
  status,
  payment_status: null,
  sp_company_name: "Acme",
  invoice_url: null,
  ...extra,
});

const VOUCHERS = [
  voucher(1, VoucherStatus.PENDING_MANAGER_REVIEW),
  voucher(2, VoucherStatus.PENDING_ADMIN_REVIEW),
  voucher(3, VoucherStatus.APPROVED, { payment_status: VoucherPaymentStatus.UNPAID }),
  voucher(4, VoucherStatus.REJECTED, {
    rejection_reason: "Inadequate supporting invoice details provided",
    rejected_by_first_name: "Mia",
    rejected_by_last_name: "Manager",
  }),
];

// The page renders both a desktop table and a mobile list; assert on the table.
const row = (voucherNumber: string) => {
  const table = screen.getByRole("table");
  return within(table).getByText(voucherNumber).closest("tr") as HTMLElement;
};

async function renderAs(role: keyof typeof roles, list = VOUCHERS) {
  useAuthMock.mockReturnValue(roles[role]);
  apiMock.get.mockImplementation(async (url: string) => {
    if (url === "/permissions/me") return { data: { permissionLevels: {} } };
    return { data: list };
  });
  render(<VouchersPage />);
  await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
}

describe("VouchersPage workflow gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsRef.current = new URLSearchParams();
  });

  it("Finance Manager can review only vouchers waiting at the manager stage", async () => {
    await renderAs("manager");
    expect(within(row("VOU-2026-0001")).getByText("Review")).toBeInTheDocument();
    expect(within(row("VOU-2026-0002")).queryByText("Review")).not.toBeInTheDocument();
    expect(within(row("VOU-2026-0003")).queryByText("Review")).not.toBeInTheDocument();
    expect(within(row("VOU-2026-0004")).queryByText("Review")).not.toBeInTheDocument();
  });

  it("Administrator can review vouchers at the Administrator stage (and a super admin may also act on the manager stage)", async () => {
    await renderAs("admin");
    expect(within(row("VOU-2026-0002")).getByText("Review")).toBeInTheDocument();
    expect(within(row("VOU-2026-0003")).queryByText("Review")).not.toBeInTheDocument();
    expect(within(row("VOU-2026-0004")).queryByText("Review")).not.toBeInTheDocument();
  });

  it("Finance Executive cannot review at all, but can move the payment slider of an approved voucher", async () => {
    await renderAs("executive");
    expect(screen.queryAllByText("Review")).toHaveLength(0);

    const slider = within(row("VOU-2026-0003")).getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuetext", "Unpaid");
    expect(slider).toHaveAttribute("aria-disabled", "false");
    // Vouchers that are not approved have no payment tracking.
    expect(within(row("VOU-2026-0001")).queryByRole("slider")).not.toBeInTheDocument();
  });

  it("Finance Manager cannot move payment stages", async () => {
    await renderAs("manager");
    expect(within(row("VOU-2026-0003")).getByRole("slider")).toHaveAttribute("aria-disabled", "true");
  });

  it("shows the rejection reason and who rejected it to the creator", async () => {
    await renderAs("executive");
    expect(
      within(row("VOU-2026-0004")).getByText(
        "Inadequate supporting invoice details provided (rejected by Mia Manager)",
      ),
    ).toBeInTheDocument();
  });

  it("uses the approval-queue endpoint for the Administrator's pending_admin_review view", async () => {
    searchParamsRef.current = new URLSearchParams("status=pending_admin_review");
    await renderAs("admin", [VOUCHERS[1]]);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith("/vouchers/approval-queue"));
    expect(screen.getByText("Voucher Approval Queue")).toBeInTheDocument();
  });

  it("filters by payment status via the URL", async () => {
    searchParamsRef.current = new URLSearchParams("payment_status=unpaid");
    await renderAs("executive", [VOUCHERS[2]]);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith("/vouchers?payment_status=unpaid"));
  });

  it("ignores a stale or unknown status in the URL instead of sending it to the API", async () => {
    searchParamsRef.current = new URLSearchParams("status=bank_upload");
    await renderAs("executive");
    expect(apiMock.get).toHaveBeenCalledWith("/vouchers");
    expect(apiMock.get).not.toHaveBeenCalledWith(expect.stringContaining("bank_upload"));
  });
});

describe("VouchersPage - approved-but-unpaid Excel download", () => {
  const createObjectURL = vi.fn(() => "blob:fake");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsRef.current = new URLSearchParams();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  async function renderWithExport(exportImpl: () => Promise<unknown>) {
    useAuthMock.mockReturnValue(roles.executive);
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === "/permissions/me") return { data: { permissionLevels: {} } };
      if (url === "/vouchers/exports/approved-unpaid") return exportImpl();
      return { data: VOUCHERS };
    });
    render(<VouchersPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  }

  it("downloads the file from the export endpoint as a blob", async () => {
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = realCreate(tag);
      if (tag === "a") (el as HTMLAnchorElement).click = () => clicks.push((el as HTMLAnchorElement).download);
      return el;
    }) as typeof document.createElement);

    await renderWithExport(async () => ({ data: new Blob(["x"]) }));
    fireEvent.click(screen.getByRole("button", { name: /Download Excel/ }));

    await waitFor(() => expect(clicks).toHaveLength(1));
    expect(apiMock.get).toHaveBeenCalledWith("/vouchers/exports/approved-unpaid", { responseType: "blob" });
    expect(clicks[0]).toMatch(/^approved-unpaid-vouchers-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
    vi.restoreAllMocks();
  });

  it("shows the server's message when the download fails", async () => {
    await renderWithExport(async () => {
      throw { response: { data: { message: "Forbidden" } } };
    });
    fireEvent.click(screen.getByRole("button", { name: /Download Excel/ }));
    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
  });
});
