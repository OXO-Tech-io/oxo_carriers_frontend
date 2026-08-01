import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";

interface Row {
  id: number;
  name: string;
  age: number;
}

const columns: ColumnDef<Row, any>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "age", header: "Age" },
];

const rows: Row[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  age: 20 + i,
}));

describe("DataTable", () => {
  it("shows a skeleton table while loading", () => {
    const { container } = render(<DataTable columns={columns} data={[]} isLoading />);
    expect(container.querySelectorAll("table")).toHaveLength(1);
    expect(screen.getAllByText("Name").length).toBeGreaterThan(0);
    // Skeleton rows use the shimmering placeholder divs, not real cell text.
    expect(screen.queryByText("Person 1")).not.toBeInTheDocument();
  });

  it("renders an empty state when there is no data", () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="No people" />);
    expect(screen.getByText("No people")).toBeInTheDocument();
  });

  it("renders a custom empty state node when provided", () => {
    render(<DataTable columns={columns} data={[]} emptyState={<div>Custom empty</div>} />);
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
  });

  it("renders rows and paginates client-side with the default page size", () => {
    render(<DataTable columns={columns} data={rows} pageSize={10} />);
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getByText("Person 10")).toBeInTheDocument();
    expect(screen.queryByText("Person 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("2"));
    expect(screen.getByText("Person 11")).toBeInTheDocument();
    expect(screen.queryByText("Person 1")).not.toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={rows.slice(0, 3)} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Person 2"));
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ name: "Person 2" }));
  });

  it("toggles sorting when a sortable header is clicked, flipping direction on a second click", () => {
    render(<DataTable columns={columns} data={rows.slice(0, 5)} />);
    const nameOf = (rowIndex: number) =>
      screen.getAllByRole("row")[rowIndex + 1].querySelector("td")!.textContent;

    fireEvent.click(screen.getByText("Age"));
    const firstClickOrder = [nameOf(0), nameOf(4)];

    fireEvent.click(screen.getByText("Age"));
    const secondClickOrder = [nameOf(0), nameOf(4)];

    // Whichever direction TanStack Table applies on the first click, a second click on the same
    // header must reverse it — the two orderings are mirror images of each other.
    expect(secondClickOrder).toEqual([firstClickOrder[1], firstClickOrder[0]]);
  });

  it("supports manual (server-driven) pagination via onPageChange", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 5)}
        manualPagination
        pageIndex={0}
        pageCount={4}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
