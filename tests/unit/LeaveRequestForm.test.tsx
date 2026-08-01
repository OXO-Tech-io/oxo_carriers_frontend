import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeaveRequestForm from "@/components/forms/LeaveRequestForm";

const { apiMock, useAuthMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn() },
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));

// The form's <label> elements aren't associated with their inputs via htmlFor/id, so
// getByLabelText can't be used — fields are located positionally instead.
const renderForm = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <LeaveRequestForm />
    </QueryClientProvider>,
  );
  const dateInputs = () => utils.container.querySelectorAll('input[type="date"]');
  return {
    ...utils,
    leaveTypeSelect: () => utils.container.querySelector("select")!,
    startDateInput: () => dateInputs()[0],
    endDateInput: () => dateInputs()[1],
  };
};

describe("LeaveRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { employee_id: "E1" } });
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/leave-types") {
        return Promise.resolve({ data: { data: [{ id: "1", name: "Annual" }] } });
      }
      if (url.startsWith("/leaves/")) {
        return Promise.resolve({ data: { data: [{ leave_type_id: "1", remaining_days: 12 }] } });
      }
      if (url.startsWith("/leave-calendars/range")) {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
    vi.stubGlobal("alert", vi.fn());
    // jsdom doesn't implement createObjectURL; the component calls it on file selection.
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => "blob:mock");
    } else {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    }
  });

  it("loads leave types with remaining-day balances into the select", async () => {
    renderForm();
    await waitFor(() =>
      expect(screen.getByText("Annual (12 days remaining)")).toBeInTheDocument(),
    );
  });

  it("shows validation errors when submitting an empty form", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Submit Request/ }));
    await waitFor(() => expect(screen.getByText("Leave type is required")).toBeInTheDocument());
    expect(screen.getByText("Start date is required")).toBeInTheDocument();
    expect(screen.getByText("End date is required")).toBeInTheDocument();
    expect(screen.getByText("Reason must be at least 10 characters")).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
  });

  it("calculates total days from the selected date range", async () => {
    const form = renderForm();
    await waitFor(() => expect(screen.getByText("Annual (12 days remaining)")).toBeInTheDocument());

    fireEvent.change(form.startDateInput(), { target: { value: "2026-02-01" } });
    fireEvent.change(form.endDateInput(), { target: { value: "2026-02-03" } });

    await waitFor(() => expect(screen.getByText("3 day(s)")).toBeInTheDocument());
  });

  // NOTE ON A DISCOVERED BUG: the zod schema declares `attachment: z.instanceof(File).optional()`,
  // but react-hook-form's uncontrolled `register()` reads a file input's value as its `.files`
  // FileList (confirmed empirically here, both with and without a file selected) — never a bare
  // `File`, and never `undefined` once the field has been registered. `z.instanceof(File)` rejects
  // a FileList unconditionally, so validation fails on every submission regardless of whether an
  // attachment is chosen, and since the JSX never renders `errors.attachment`, the form silently
  // does nothing when "Submit Request" is clicked. This reproduces with a real File attached below,
  // not just with an empty field, confirming the request can never currently be submitted through
  // this form. Left unfixed per the task's instructions not to change business logic while writing
  // tests — flagged prominently in the final report instead.
  it("never calls the API on submit — even with every field valid and a file attached — due to the schema bug above", async () => {
    const form = renderForm();
    await waitFor(() => expect(screen.getByText("Annual (12 days remaining)")).toBeInTheDocument());

    fireEvent.change(form.leaveTypeSelect(), { target: { value: "1" } });
    fireEvent.change(form.startDateInput(), { target: { value: "2026-02-01" } });
    fireEvent.change(form.endDateInput(), { target: { value: "2026-02-03" } });
    fireEvent.change(screen.getByPlaceholderText(/Please provide details/), {
      target: { value: "Family vacation trip" },
    });
    const fileInput = form.container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "note.pdf")] } });

    fireEvent.submit(form.container.querySelector("form")!);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(apiMock.post).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("lists holidays that fall within the selected date range", async () => {
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/leave-types") return Promise.resolve({ data: { data: [{ id: "1", name: "Annual" }] } });
      if (url.startsWith("/leaves/")) return Promise.resolve({ data: { data: [] } });
      if (url.startsWith("/leave-calendars/range")) {
        return Promise.resolve({
          data: { data: [{ id: 1, date: "2026-02-02", name: "Public Holiday", is_recurring: false }] },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const form = renderForm();
    fireEvent.change(form.startDateInput(), { target: { value: "2026-02-01" } });
    fireEvent.change(form.endDateInput(), { target: { value: "2026-02-03" } });

    await waitFor(() => expect(screen.getByText(/Public Holiday/)).toBeInTheDocument());
  });
});
