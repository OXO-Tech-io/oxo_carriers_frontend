import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import StepReview from "@/components/modals/employee-wizard/StepReview";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";
import { UserRole } from "@/types";

const { useLeaveTypesQueryMock } = vi.hoisted(() => ({ useLeaveTypesQueryMock: vi.fn() }));
vi.mock("@/hooks/queries/use-leave-types-query", () => ({ useLeaveTypesQuery: useLeaveTypesQueryMock }));

const MESSAGE = "Please confirm the declaration before creating this employee";

function Harness({
  showDeclarationError,
  role,
  hireDate,
}: Readonly<{ showDeclarationError?: boolean; role?: UserRole; hireDate?: string }>) {
  const form = useForm<EmployeeWizardValues>({
    defaultValues: {
      ...defaultEmployeeWizardValues,
      ...(role ? { role } : {}),
      ...(hireDate ? { hire_date: hireDate } : {}),
    },
  });
  return (
    <>
      {/* Mirrors CreateUserModal's handleFinalSubmit() declaration check. */}
      <button type="button" onClick={() => form.trigger(["declarationAccepted"] as any)}>
        Create Employee
      </button>
      <StepReview form={form} showDeclarationError={showDeclarationError} />
    </>
  );
}

beforeEach(() => {
  useLeaveTypesQueryMock.mockReturnValue({ data: [] });
});

describe("StepReview declaration validation", () => {
  it("shows the message when Create Employee is clicked without ticking the declaration", async () => {
    render(<Harness />);
    expect(screen.queryByText(MESSAGE)).toBeNull();
    fireEvent.click(screen.getByText("Create Employee"));
    expect(await screen.findByText(MESSAGE)).toBeTruthy();
  });

  it("shows the message from the showDeclarationError prop without relying on react-hook-form errors", () => {
    render(<Harness showDeclarationError />);
    expect(screen.getByText(MESSAGE)).toBeTruthy();
  });

  it("does not show the message when showDeclarationError is false", () => {
    render(<Harness showDeclarationError={false} />);
    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it("has no declaration for Service Providers", () => {
    render(<Harness role={UserRole.SERVICE_PROVIDER} showDeclarationError />);
    expect(screen.queryByText(MESSAGE)).toBeNull();
  });
});

describe("StepReview Casual Leave Entitlement", () => {
  beforeEach(() => {
    useLeaveTypesQueryMock.mockReturnValue({ data: [{ id: 2, name: "Casual Leave", max_days: 7 }] });
  });

  // The joining month counts: joined 5 Oct -> Oct, Nov, Dec = 3 months = 1.5 days
  // (same rule as calculateAccruedCasualLeave in the backend).
  it("shows 1.5 days (0.5 x 3 months) for an employee who joined on 5 October 2026", () => {
    render(<Harness hireDate="2026-10-05" />);
    expect(screen.getByText("1.5 days in 2026")).toBeTruthy();
    expect(screen.getByText("0.5 days × 3 months, then 7 days per year")).toBeTruthy();
  });

  it("caps the first-year entitlement at the leave type's max days", () => {
    useLeaveTypesQueryMock.mockReturnValue({ data: [{ id: 2, name: "Casual Leave", max_days: 3 }] });
    render(<Harness hireDate="2026-01-10" />);
    expect(screen.getByText("3 days in 2026")).toBeTruthy();
  });
});
