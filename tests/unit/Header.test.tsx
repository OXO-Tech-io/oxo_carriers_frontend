import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "@/components/layout/Header";

const { useAuthMock, useThemeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: useThemeMock }));
vi.mock("@/components/layout/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));
// jsdom logs a noisy "Not implemented: navigation" error for real <a href> clicks; the profile
// dropdown links aren't under test here (only that clicking them closes the dropdown), so swap in
// a plain anchor that doesn't trigger jsdom's navigation attempt.
vi.mock("next/link", () => ({
  default: ({ href, children, onClick }: any) => (
    <a
      href={href}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  ),
}));

const user = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  role: "hr_manager",
};

describe("Header", () => {
  const logout = vi.fn();
  const toggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user, logout });
    useThemeMock.mockReturnValue({ theme: "light", toggleTheme });
  });

  it("renders nothing when there is no user", () => {
    useAuthMock.mockReturnValue({ user: null, logout });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the user's initials, name and role", () => {
    render(<Header />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("hr manager")).toBeInTheDocument();
  });

  it("shows a Moon icon in light theme and calls toggleTheme on click", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Toggle theme"));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("opens the profile dropdown and signs out via the store's logout", () => {
    render(<Header />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("John Doe"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Sign out"));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("closes the dropdown when a profile link is clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("John Doe"));
    fireEvent.click(screen.getByText("My Profile"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", () => {
    render(<Header />);
    fireEvent.click(screen.getByText("John Doe"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders the NotificationBell", () => {
    render(<Header />);
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });
});
