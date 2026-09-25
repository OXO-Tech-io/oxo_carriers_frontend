import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, type UseFormReturn } from "react-hook-form";
import StepStatutory from "@/components/profile/wizard/StepStatutory";
import type { WizardFormValues } from "@/components/profile/wizard/wizardTypes";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";

const { apiMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn().mockResolvedValue({ data: { exists: false } }) },
}));
vi.mock("@/lib/api", () => ({ default: apiMock }));

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  const profileForm = form as unknown as UseFormReturn<WizardFormValues>;
  return (
    <>
      {/* Mirrors CreateUserModal's goNext(), which validates the current
          step via an explicit form.trigger(...) call ("Next" only advances
          if it resolves true) rather than on blur - useForm() here is given
          no `mode`, so it defaults to onSubmit and blur alone never runs a
          field's `validate` rule. */}
      <button type="button" onClick={() => form.trigger("dateOfBirth")}>
        Trigger Validation
      </button>
      <StepStatutory form={profileForm} email="" designation="" />
    </>
  );
}

// The "Age" field's <label> and <input> are rendered as siblings (not
// nested, no htmlFor/id), so it isn't reachable via getByLabelText - locate
// it via the label text's parent container instead.
function getAgeInput(): HTMLInputElement {
  const label = screen.getByText("Age");
  const input = label.parentElement?.querySelector("input");
  if (!input) throw new Error("Age input not found");
  return input as HTMLInputElement;
}

describe("StepStatutory - Date of Birth / Age (OCD-417)", () => {
  it("calculates and displays Age immediately after selecting a Date of Birth, with no extra navigation", () => {
    render(<Harness />);

    const dobInput = document.querySelector('input[name="dateOfBirth"]') as HTMLInputElement;
    const ageInput = getAgeInput();
    expect(ageInput.value).toBe("");

    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    fireEvent.change(dobInput, { target: { value: dob.toISOString().slice(0, 10) } });

    expect(ageInput.value).toBe("30 years");
  });

  it("updates Age again immediately when the Date of Birth is changed a second time", () => {
    render(<Harness />);

    const dobInput = document.querySelector('input[name="dateOfBirth"]') as HTMLInputElement;
    const ageInput = getAgeInput();
    const today = new Date();

    fireEvent.change(dobInput, {
      target: { value: new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()).toISOString().slice(0, 10) },
    });
    expect(ageInput.value).toBe("25 years");

    fireEvent.change(dobInput, {
      target: { value: new Date(today.getFullYear() - 40, today.getMonth(), today.getDate()).toISOString().slice(0, 10) },
    });
    expect(ageInput.value).toBe("40 years");
  });

  it("rejects a future Date of Birth once validation is triggered (e.g. clicking Next)", async () => {
    render(<Harness />);

    const dobInput = document.querySelector('input[name="dateOfBirth"]') as HTMLInputElement;
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    fireEvent.change(dobInput, { target: { value: future.toISOString().slice(0, 10) } });
    fireEvent.click(screen.getByText("Trigger Validation"));

    expect(await screen.findByText("Date cannot be a future date. Please enter a valid date.")).toBeTruthy();
  });
});
