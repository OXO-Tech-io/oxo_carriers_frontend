import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/contexts/ToastContext";

function Consumer() {
  const { toasts, toast, success, error, warning, info, dismiss, dismissAll } = useToast();
  return (
    <div>
      <span data-testid="count">{toasts.length}</span>
      <button onClick={() => toast({ type: "info", title: "Generic" })}>generic</button>
      <button onClick={() => success("Saved", "All good")}>success</button>
      <button onClick={() => error("Failed", "Try again")}>error</button>
      <button onClick={() => warning("Careful", undefined, 0)}>warning-persist</button>
      <button onClick={() => info("FYI")}>info</button>
      <button onClick={() => toasts[0] && dismiss(toasts[0].id)}>dismiss-first</button>
      <button onClick={dismissAll}>dismiss-all</button>
    </div>
  );
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useToast throws when used outside a ToastProvider", () => {
    function Standalone() {
      useToast();
      return null;
    }
    expect(() => render(<Standalone />)).toThrow(
      "useToast must be used within <ToastProvider>",
    );
  });

  it("toast() adds a toast and renders it in the container", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("generic"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByText("Generic")).toBeInTheDocument();
  });

  it("success/error/warning/info convenience methods set the right type and message", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("success"));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();

    fireEvent.click(screen.getByText("error"));
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("auto-dismisses a toast after its duration plus the exit animation", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("generic"));
    expect(screen.getByTestId("count").textContent).toBe("1");

    act(() => {
      vi.advanceTimersByTime(4500); // default duration
    });
    // still present but marked exiting until the 320ms removal timer fires
    expect(screen.getByTestId("count").textContent).toBe("1");

    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("a duration of 0 persists the toast (no auto-dismiss timer)", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("warning-persist"));
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("dismiss() removes a specific toast after the exit animation", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("warning-persist"));
    expect(screen.getByTestId("count").textContent).toBe("1");

    fireEvent.click(screen.getByText("dismiss-first"));
    expect(screen.getByTestId("count").textContent).toBe("1"); // still mounted, exiting

    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("dismissAll() clears every toast after the exit animation", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("warning-persist"));
    fireEvent.click(screen.getByText("info"));
    expect(screen.getByTestId("count").textContent).toBe("2");

    fireEvent.click(screen.getByText("dismiss-all"));
    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("clicking the toast's own dismiss button removes it", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("warning-persist"));
    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("renders nothing in the container when there are no toasts", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    expect(screen.queryByLabelText("Notifications")).not.toBeInTheDocument();
  });
});
