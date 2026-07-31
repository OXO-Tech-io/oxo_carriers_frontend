import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BottomNavigation from "@/components/layout/BottomNavigation";

const { useAuthMock, usePathnameMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));

describe("BottomNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/");
  });

  it("renders nothing when there is no authenticated user", () => {
    useAuthMock.mockReturnValue({ user: null });
    const { container } = render(<BottomNavigation />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders all five nav items when a user is present", () => {
    useAuthMock.mockReturnValue({ user: { role: "employee" } });
    render(<BottomNavigation />);
    ["Dashboard", "Leaves", "Salary", "Claims", "Profile"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("marks the link matching the current pathname as active", () => {
    useAuthMock.mockReturnValue({ user: { role: "employee" } });
    usePathnameMock.mockReturnValue("/leaves");
    render(<BottomNavigation />);
    const leavesLink = screen.getByText("Leaves").closest("a");
    expect(leavesLink?.className).toContain("text-[var(--primary)]");
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).not.toContain("text-[var(--primary)]");
  });

  it("each nav item links to its expected href", () => {
    useAuthMock.mockReturnValue({ user: { role: "employee" } });
    render(<BottomNavigation />);
    expect(screen.getByText("Salary").closest("a")).toHaveAttribute("href", "/salary");
    expect(screen.getByText("Claims").closest("a")).toHaveAttribute("href", "/medical-insurance");
    expect(screen.getByText("Profile").closest("a")).toHaveAttribute("href", "/profile");
  });
});
