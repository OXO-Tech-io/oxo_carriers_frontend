import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

function Consumer() {
  const { collapsed, toggle, setCollapsed } = useSidebar();
  return (
    <div>
      <span data-testid="state">{collapsed ? "collapsed" : "expanded"}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setCollapsed(true)}>collapse</button>
    </div>
  );
}

describe("SidebarContext", () => {
  it("useSidebar without a provider falls back to a safe no-op default", () => {
    function Standalone() {
      const { collapsed } = useSidebar();
      return <span data-testid="state">{collapsed ? "collapsed" : "expanded"}</span>;
    }
    render(<Standalone />);
    expect(screen.getByTestId("state").textContent).toBe("expanded");
  });

  it("defaults to expanded and toggle() flips collapsed state", () => {
    render(
      <SidebarProvider>
        <Consumer />
      </SidebarProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("expanded");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("state").textContent).toBe("collapsed");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("state").textContent).toBe("expanded");
  });

  it("setCollapsed sets the value directly", () => {
    render(
      <SidebarProvider>
        <Consumer />
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByText("collapse"));
    expect(screen.getByTestId("state").textContent).toBe("collapsed");
  });
});
