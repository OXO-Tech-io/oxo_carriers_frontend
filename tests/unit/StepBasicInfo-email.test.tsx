import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import StepBasicInfo from "@/components/modals/employee-wizard/StepBasicInfo";
import { defaultEmployeeWizardValues, type EmployeeWizardValues } from "@/components/modals/employee-wizard/wizardTypes";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn().mockResolvedValue({ data: { exists: false } }) } }));

function Harness() {
  const form = useForm<EmployeeWizardValues>({ defaultValues: defaultEmployeeWizardValues });
  return (
    <>
      {/* Mirrors CreateUserModal's goNext() for the "basic" step. */}
      <button type="button" onClick={() => form.trigger(["email", "personalEmail"] as any)}>
        Next
      </button>
      <StepBasicInfo form={form} />
    </>
  );
}

const input = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

describe("StepBasicInfo email format", () => {
  it.each(["abc123.@gmail.com", "abc..123@gmail.com", "abc123@gmail..com"])(
    "shows 'Enter a valid email address' for the work email %s",
    async (value) => {
      render(<Harness />);
      fireEvent.change(input("email"), { target: { value } });
      fireEvent.click(screen.getByText("Next"));
      expect((await screen.findAllByText("Enter a valid email address")).length).toBeGreaterThan(0);
    },
  );

  it("shows the message for the personal email too", async () => {
    render(<Harness />);
    fireEvent.change(input("email"), { target: { value: "abc123@gmail.com" } });
    fireEvent.change(input("personalEmail"), { target: { value: "abc123.@gmail.com" } });
    fireEvent.click(screen.getByText("Next"));
    expect(await screen.findByText("Enter a valid email address")).toBeTruthy();
  });

  it("accepts a normal address with a dot in the middle", async () => {
    render(<Harness />);
    fireEvent.change(input("email"), { target: { value: "abc.123@gmail.com" } });
    fireEvent.change(input("personalEmail"), { target: { value: "abc.123@gmail.com" } });
    fireEvent.click(screen.getByText("Next"));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Enter a valid email address")).toBeNull();
  });
});

describe("StepBasicInfo email uniqueness (OCD-595)", () => {
  it("shows the duplicate message immediately when the field loses focus", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { exists: true } });
    render(<Harness />);
    fireEvent.change(input("email"), { target: { value: "taken@example.com" } });
    fireEvent.blur(input("email"));
    expect(
      await screen.findByText("Email address already exists. Please use a different email address."),
    ).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/users/email-availability", { params: { email: "taken@example.com" } });
  });
});
