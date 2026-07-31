import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationBell } from "@/components/layout/NotificationBell";

const {
  useNotificationsQueryMock,
  useUnreadNotificationsCountQueryMock,
  markReadMutateMock,
  markAllReadMutateMock,
  routerMock,
} = vi.hoisted(() => ({
  useNotificationsQueryMock: vi.fn(),
  useUnreadNotificationsCountQueryMock: vi.fn(),
  markReadMutateMock: vi.fn(),
  markAllReadMutateMock: vi.fn(),
  routerMock: { push: vi.fn() },
}));

vi.mock("@/hooks/queries/use-notifications-query", () => ({
  useNotificationsQuery: useNotificationsQueryMock,
}));
vi.mock("@/hooks/queries/use-unread-notifications-count-query", () => ({
  useUnreadNotificationsCountQuery: useUnreadNotificationsCountQueryMock,
}));
vi.mock("@/hooks/mutations/use-mark-notification-read-mutation", () => ({
  useMarkNotificationReadMutation: () => ({ mutate: markReadMutateMock }),
}));
vi.mock("@/hooks/mutations/use-mark-all-notifications-read-mutation", () => ({
  useMarkAllNotificationsReadMutation: () => ({ mutate: markAllReadMutateMock }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));

const notifications = [
  {
    id: 1,
    title: "Leave approved",
    message: "Your leave request was approved",
    isRead: false,
    link: "/leaves",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Reminder",
    message: "Please submit your work log",
    isRead: true,
    link: null,
    createdAt: new Date().toISOString(),
  },
];

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationsQueryMock.mockReturnValue({ data: notifications });
    useUnreadNotificationsCountQueryMock.mockReturnValue({ data: 1 });
  });

  it("shows an unread badge dot when there is at least one unread notification", () => {
    const { container } = render(<NotificationBell />);
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
  });

  it("hides the unread badge when the count is zero", () => {
    useUnreadNotificationsCountQueryMock.mockReturnValue({ data: 0 });
    const { container } = render(<NotificationBell />);
    expect(container.querySelector(".bg-red-500")).not.toBeInTheDocument();
  });

  it("opens the dropdown on click and lists notifications", () => {
    render(<NotificationBell />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Leave approved")).toBeInTheDocument();
    expect(screen.getByText("Reminder")).toBeInTheDocument();
  });

  it("shows an empty message when there are no notifications", () => {
    useNotificationsQueryMock.mockReturnValue({ data: [] });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("clicking an unread notification marks it read, navigates and closes the dropdown", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    fireEvent.click(screen.getByText("Leave approved"));

    expect(markReadMutateMock).toHaveBeenCalledWith(1);
    expect(routerMock.push).toHaveBeenCalledWith("/leaves");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("clicking an already-read notification does not call markRead", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    fireEvent.click(screen.getByText("Reminder"));
    expect(markReadMutateMock).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("clicking 'Mark all read' calls the bulk mutation", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    fireEvent.click(screen.getByText("Mark all read"));
    expect(markAllReadMutateMock).toHaveBeenCalled();
  });

  it("hides the 'Mark all read' action when there are no unread notifications", () => {
    useUnreadNotificationsCountQueryMock.mockReturnValue({ data: 0 });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
