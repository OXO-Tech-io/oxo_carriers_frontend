import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import StepEducation from "@/components/modals/employee-wizard/StepEducation";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";
import { localIsoDate } from "@/lib/validation/textValidation";

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  return (
    <>
      <StepEducation form={form} />
      <button type="button" onClick={() => void form.trigger("undergraduateDegreeCompletionDate")}>
        Validate completion date
      </button>
    </>
  );
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

describe("StepEducation Undergraduate Degree Completion Date - future dates only", () => {
  const FUTURE_ONLY_MESSAGE = "Date must be a future date. Please select a date after today.";

  async function enableCompletionDate() {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Qualification"));
    fireEvent.click(currentlyPursuing());
    await waitFor(() => expect(completionDate().disabled).toBe(false));
  }

  it("sets the picker's min to tomorrow so today and past days can't be selected", () => {
    render(<Harness />);
    expect(completionDate().min).toBe(localIsoDate(1));
  });

  it.each([
    ["today", () => localIsoDate()],
    ["a past date", () => "2020-01-01"],
  ])("rejects %s", async (_label, getDate) => {
    await enableCompletionDate();
    fireEvent.change(completionDate(), { target: { value: getDate() } });
    fireEvent.click(screen.getByText("Validate completion date"));
    expect(await screen.findByText(FUTURE_ONLY_MESSAGE)).toBeTruthy();
  });

  it("accepts a future date", async () => {
    await enableCompletionDate();
    fireEvent.change(completionDate(), { target: { value: localIsoDate(30) } });
    fireEvent.click(screen.getByText("Validate completion date"));
    await waitFor(() => expect(screen.queryByText(FUTURE_ONLY_MESSAGE)).toBeNull());
  });
});
