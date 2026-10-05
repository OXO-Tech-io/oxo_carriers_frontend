import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import StepEducation from "@/components/modals/employee-wizard/StepEducation";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  return <StepEducation form={form} />;
}

const completionDate = () => document.querySelector('input[name="undergraduateDegreeCompletionDate"]') as HTMLInputElement;
const dateAwarded = () => document.querySelector('input[name="education.0.dateAwarded"]') as HTMLInputElement;
const currentlyPursuing = () => document.querySelector('input[name="education.0.isOngoing"]') as HTMLInputElement;

describe("StepEducation 'Currently pursuing' checkbox", () => {
  it("enables the Undergraduate Degree Completion Date picker and disables Date Awarded when ticked", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Qualification"));
    expect(completionDate().disabled).toBe(true);
    expect(dateAwarded().disabled).toBe(false);

    fireEvent.click(currentlyPursuing());
    await waitFor(() => expect(completionDate().disabled).toBe(false));
    expect(dateAwarded().disabled).toBe(true);
  });

  it("disables the completion date again once no qualification is being pursued", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Qualification"));
    fireEvent.click(currentlyPursuing());
    await waitFor(() => expect(completionDate().disabled).toBe(false));

    fireEvent.click(currentlyPursuing());
    await waitFor(() => expect(completionDate().disabled).toBe(true));
    expect(dateAwarded().disabled).toBe(false);
  });
});
