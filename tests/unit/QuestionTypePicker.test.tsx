import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionTypePicker } from "@/components/forms/QuestionTypePicker";
import { QUESTION_TYPES } from "@/components/forms/questionTypes";

describe("QuestionTypePicker", () => {
  it("renders every non-layout question type grouped under its category", () => {
    render(<QuestionTypePicker onPick={vi.fn()} onAddSection={vi.fn()} />);
    expect(screen.getByText("Short answer")).toBeInTheDocument();
    expect(screen.getByText("Multiple choice")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Choice")).toBeInTheDocument();
  });

  it("renders layout types separately alongside the add-section action", () => {
    render(<QuestionTypePicker onPick={vi.fn()} onAddSection={vi.fn()} />);
    expect(screen.getByText("Section header")).toBeInTheDocument();
    expect(screen.getByText("New section (page break)")).toBeInTheDocument();
  });

  it("calls onPick with the clicked type", () => {
    const onPick = vi.fn();
    render(<QuestionTypePicker onPick={onPick} onAddSection={vi.fn()} />);
    fireEvent.click(screen.getByText("Multiple choice"));
    expect(onPick).toHaveBeenCalledWith("multiple_choice");
  });

  it("calls onAddSection when the section button is clicked", () => {
    const onAddSection = vi.fn();
    render(<QuestionTypePicker onPick={vi.fn()} onAddSection={onAddSection} />);
    fireEvent.click(screen.getByText("New section (page break)"));
    expect(onAddSection).toHaveBeenCalledTimes(1);
  });

  it("renders exactly one button per question type plus the add-section button", () => {
    render(<QuestionTypePicker onPick={vi.fn()} onAddSection={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(QUESTION_TYPES.length + 1);
  });
});
