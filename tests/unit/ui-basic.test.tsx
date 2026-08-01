import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, StatCardSkeleton, TableRowSkeleton, DashboardSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";

describe("Button", () => {
  it("renders children and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables the button and shows a spinner when isLoading", () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("is disabled when the disabled prop is set even without isLoading", () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders left and right icons alongside children", () => {
    render(
      <Button leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>
        Go
      </Button>,
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("renders children inside a card container", () => {
    render(<Card>Body content</Card>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("CardHeader renders a title, optional subtitle, and action slot", () => {
    render(<CardHeader title="Title" subtitle="Subtitle" action={<button>Action</button>} />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("CardHeader omits the subtitle paragraph when not provided", () => {
    render(<CardHeader title="Title only" />);
    expect(screen.getByText("Title only")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders a title, description and action", () => {
    render(<EmptyState title="Nothing here" description="Try again later" action={<button>Retry</button>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("omits description when not provided", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("renders a hidden placeholder block", () => {
    const { container } = render(<Skeleton className="h-4 w-4" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden");
  });

  it("StatCardSkeleton, TableRowSkeleton and DashboardSkeleton render without crashing", () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton cols={3} />
        </tbody>
      </table>,
    );
    render(<StatCardSkeleton />);
    render(<DashboardSkeleton />);
  });

  it("TableRowSkeleton renders the requested number of cells", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={4} />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll("td")).toHaveLength(4);
  });
});

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination pageIndex={0} pageCount={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders page numbers and disables Prev on the first page", () => {
    const onPageChange = vi.fn();
    render(<Pagination pageIndex={0} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByText("Prev")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
    fireEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables Next on the last page and shows an ellipsis for large page counts", () => {
    const onPageChange = vi.fn();
    render(<Pagination pageIndex={9} pageCount={10} onPageChange={onPageChange} />);
    expect(screen.getByText("Next")).toBeDisabled();
    expect(screen.getByText("…")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Prev"));
    expect(onPageChange).toHaveBeenCalledWith(8);
  });

  it("shows a range label when pageSize and totalItems are provided", () => {
    render(<Pagination pageIndex={1} pageCount={3} pageSize={10} totalItems={25} onPageChange={vi.fn()} />);
    expect(screen.getByText("Showing 11–20 of 25")).toBeInTheDocument();
  });
});
