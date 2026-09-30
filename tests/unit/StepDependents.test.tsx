import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, type UseFormReturn } from "react-hook-form";
import StepDependents from "@/components/profile/wizard/StepDependents";
import type { WizardFormValues } from "@/components/profile/wizard/wizardTypes";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  const profileForm = form as unknown as UseFormReturn<WizardFormValues>;
  return (
    <>
      {/* Mirrors CreateUserModal's goNext() for the "dependents" step. */}
      <button type="button" onClick={() => form.trigger(["dependents"] as any)}>
        Next
      </button>
      <StepDependents form={profileForm} isMarried />
    </>
  );
}

const input = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

const MOBILE_ERROR = "Please enter a valid mobile number starting with 07 and containing 10 digits.";

describe("StepDependents validation on Next", () => {
  it("shows the Mobile Number message for an invalid family member number", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Family Member"));
    fireEvent.change(input("dependents.0.mobileNumber"), { target: { value: "0812345678" } });
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText(MOBILE_ERROR)).toBeTruthy();
  });

  it("shows the required messages for an empty family member", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Family Member"));
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText("Full name is required")).toBeTruthy();
    expect(screen.getByText("Date of birth is required")).toBeTruthy();
    expect(screen.getByText("Gender is required")).toBeTruthy();
    expect(screen.getByText("Relationship is required")).toBeTruthy();
  });

  it("validates every added family member, not just the first", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Family Member"));
    fireEvent.click(screen.getByText("Add Family Member"));
    fireEvent.change(input("dependents.1.mobileNumber"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText(MOBILE_ERROR)).toBeTruthy();
    expect(screen.getAllByText("Full name is required")).toHaveLength(2);
  });
});
