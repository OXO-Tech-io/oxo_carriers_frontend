import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Sidebar from "@/components/layout/Sidebar";

const { useAuthMock, useSidebarMock, usePathnameMock, useSearchParamsMock, apiMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useSidebarMock: vi.fn(),
  usePathnameMock: vi.fn(),
  useSearchParamsMock: vi.fn(),
  apiMock: { get: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/contexts/SidebarContext", () => ({ useSidebar: useSidebarMock }));
vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useSearchParams: useSearchParamsMock,
}));
vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("next/image", () => ({
  default: (props: any) => <img alt={props.alt} src={props.src} />,
}));

describe("Sidebar", () => {
  const toggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    useSidebarMock.mockReturnValue({ collapsed: false, toggle });
    apiMock.get.mockResolvedValue({ data: { permissionLevels: {} } });
  });

  it("renders nothing when there is no authenticated user", () => {
    useAuthMock.mockReturnValue({ user: null, isSuperAdmin: false });
    const { container } = render(<Sidebar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows every nav item (including admin-only) for a super admin without waiting on /permissions/me", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, first_name: "A", last_name: "B", role: "super_admin" }, isSuperAdmin: true });
    render(<Sidebar />);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Permissions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Administration").length).toBeGreaterThan(0);
    // The /permissions/me fetch still fires in the background for a super admin (its result is
    // simply ignored by canSeeItem) — flush it so the resulting setState doesn't leak into the
    // next test as an act() warning.
    await act(() => Promise.resolve());
  });

  it("filters nav items by fetched permission levels for a non-super-admin user", async () => {
    useAuthMock.mockReturnValue({ user: { id: 2, first_name: "C", last_name: "D", role: "employee" }, isSuperAdmin: false });
    apiMock.get.mockResolvedValue({ data: { permissionLevels: { leaves: "read" } } });

    render(<Sidebar />);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith("/permissions/me"));
    await waitFor(() => expect(screen.getAllByText("Leaves").length).toBeGreaterThan(0));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("hides write-only admin items when the user only has read access", async () => {
    useAuthMock.mockReturnValue({ user: { id: 3, first_name: "E", last_name: "F", role: "employee" }, isSuperAdmin: false });
    apiMock.get.mockResolvedValue({ data: { permissionLevels: { leaves: "read" } } });

    render(<Sidebar />);
    await waitFor(() => expect(screen.getAllByText("Leaves").length).toBeGreaterThan(0));
    // "Leave Calendar" (admin nav) requires write access to the same "leaves" permission key.
    expect(screen.queryByText("Leave Calendar")).not.toBeInTheDocument();
  });

  it("falls back to no items when the permissions request fails", async () => {
    useAuthMock.mockReturnValue({ user: { id: 4, first_name: "G", last_name: "H", role: "employee" }, isSuperAdmin: false });
    apiMock.get.mockRejectedValue(new Error("network error"));

    render(<Sidebar />);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Dashboard")).not.toBeInTheDocument());
  });

  it("calls toggle() from the collapse button", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, first_name: "A", last_name: "B", role: "super_admin" }, isSuperAdmin: true });
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText("Collapse sidebar"));
    expect(toggle).toHaveBeenCalledTimes(1);
    await act(() => Promise.resolve());
  });

  it("shows an Expand label when collapsed", async () => {
    useSidebarMock.mockReturnValue({ collapsed: true, toggle });
    useAuthMock.mockReturnValue({ user: { id: 1, first_name: "A", last_name: "B", role: "super_admin" }, isSuperAdmin: true });
    render(<Sidebar />);
    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
    await act(() => Promise.resolve());
  });

  it("opens and closes the mobile sidebar via the hamburger and overlay", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, first_name: "A", last_name: "B", role: "super_admin" }, isSuperAdmin: true });
    const { container } = render(<Sidebar />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const overlay = container.querySelector(".bg-black\\/40");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(container.querySelector(".bg-black\\/40")).not.toBeInTheDocument();
    await act(() => Promise.resolve());
  });
});
