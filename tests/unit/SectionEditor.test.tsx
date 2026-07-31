import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionEditor } from "@/components/forms/SectionEditor";

const section = { id: 1, formId: 1, title: "My Section", description: "Desc", orderIndex: 0 };

describe("SectionEditor", () => {
  it("renders the section title and description in editable inputs", () => {
    render(
      <SectionEditor
        section={section}
        dragProps={{}}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        canMoveUp
        canMoveDown
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText("Section title")).toHaveValue("My Section");
    expect(screen.getByPlaceholderText("Section description (optional)")).toHaveValue("Desc");
  });

  it("calls onChange with title and description edits", () => {
    const onChange = vi.fn();
    render(
      <SectionEditor
        section={section}
        dragProps={{}}
        onChange={onChange}
        onDelete={vi.fn()}
        canMoveUp
        canMoveDown
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Section title"), { target: { value: "New title" } });
    expect(onChange).toHaveBeenCalledWith({ title: "New title" });

    fireEvent.change(screen.getByPlaceholderText("Section description (optional)"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ description: null });
  });

  it("calls onDelete when the trash button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <SectionEditor
        section={section}
        dragProps={{}}
        onChange={vi.fn()}
        onDelete={onDelete}
        canMoveUp
        canMoveDown
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Delete section"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables move buttons based on canMoveUp/canMoveDown and calls handlers when enabled", () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <SectionEditor
        section={section}
        dragProps={{}}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        canMoveUp={false}
        canMoveDown
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );
    expect(screen.getByLabelText("Move section up")).toBeDisabled();
    expect(screen.getByLabelText("Move section down")).not.toBeDisabled();
    fireEvent.click(screen.getByLabelText("Move section down"));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it("applies the drop-target styling class when dropTarget is true", () => {
    const { container } = render(
      <SectionEditor
        section={section}
        dragProps={{}}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        dropTarget
        canMoveUp
        canMoveDown
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );
    expect(container.firstChild).toHaveClass("border-[var(--primary)]");
  });
});
