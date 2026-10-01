import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import StepWorkHistory from "@/components/modals/employee-wizard/StepWorkHistory";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  return (
    <>
      {/* Mirrors CreateUserModal's goNext() for the "workHistory" step. */}
      <button type="button" onClick={() => form.trigger(["workHistory"] as any)}>
        Next
      </button>
      <StepWorkHistory form={form} />
    </>
  );
}

const input = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

describe("StepWorkHistory validation on Next", () => {
  it("shows required messages for Company / Organization and Position Held", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Work Experience"));
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText("Organization is required")).toBeTruthy();
    expect(screen.getByText("Position held is required")).toBeTruthy();
  });

  it("shows 'Emoji characters are not allowed' for Company / Organization and Position Held", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Work Experience"));
    fireEvent.change(input("workHistory.0.organization"), { target: { value: "Acme 😀" } });
    fireEvent.change(input("workHistory.0.positionHeld"), { target: { value: "Engineer 🚀" } });
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => expect(screen.getAllByText("Emoji characters are not allowed")).toHaveLength(2));
  });

  it("validates every added card, not just the first", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Add Work Experience"));
    fireEvent.click(screen.getByText("Add Work Experience"));
    fireEvent.change(input("workHistory.0.organization"), { target: { value: "Acme" } });
    fireEvent.change(input("workHistory.0.positionHeld"), { target: { value: "Engineer" } });
    fireEvent.change(input("workHistory.1.organization"), { target: { value: "Globex ❤️" } });
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText("Emoji characters are not allowed")).toBeTruthy();
    expect(screen.getByText("Position held is required")).toBeTruthy();
  });
});

describe("StepWorkHistory date-order validation on Next", () => {
  const fill = () => {
    fireEvent.click(screen.getByText("Add Work Experience"));
    fireEvent.change(input("workHistory.0.organization"), { target: { value: "Acme" } });
    fireEvent.change(input("workHistory.0.positionHeld"), { target: { value: "Engineer" } });
  };

  it("shows a message when Start Date is later than End Date", async () => {
    render(<Harness />);
    fill();
    fireEvent.change(input("workHistory.0.startDate"), { target: { value: "2024-06-01" } });
    fireEvent.change(input("workHistory.0.endDate"), { target: { value: "2024-01-01" } });
    fireEvent.click(screen.getByText("Next"));

    expect(await screen.findByText("End Date must be later than or equal to the Start Date.")).toBeTruthy();
  });
});
