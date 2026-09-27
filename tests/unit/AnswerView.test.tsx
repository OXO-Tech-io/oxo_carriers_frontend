import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerView } from "@/components/forms/AnswerView";
import { resolveFileUrl } from "@/lib/constants";
import type { FormQuestion, FormResponseAnswer } from "@/types/hrModules";

const baseQuestion = (patch: Partial<FormQuestion> = {}): FormQuestion => ({
  id: 1,
  formId: 1,
  sectionId: null,
  type: "short_answer",
  title: "Q",
  description: null,
  helpText: null,
  placeholder: null,
  required: false,
  orderIndex: 0,
  config: {},
  defaultValue: null,
  options: [],
  ...patch,
});

const option = (patch: Partial<any> = {}) => ({
  id: 1,
  questionId: 1,
  label: "Option A",
  value: "a",
  orderIndex: 0,
  isOther: false,
  ...patch,
});

const baseAnswer = (patch: Partial<FormResponseAnswer> = {}): FormResponseAnswer => ({
  id: 1,
  responseId: 1,
  questionId: 1,
  value: null,
  valueText: null,
  attachments: [],
  ...patch,
});

describe("AnswerView", () => {
  it("renders a dash when there is no answer", () => {
    render(<AnswerView question={baseQuestion()} answer={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders plain text answers from valueText", () => {
    render(<AnswerView question={baseQuestion()} answer={baseAnswer({ valueText: "Hello world" })} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders file_upload attachments as links, resolved to the API's file origin", () => {
    const q = baseQuestion({ type: "file_upload" });
    const answer = baseAnswer({
      attachments: [{ id: 1, fileName: "resume.pdf", fileUrl: "/uploads/others/resume.pdf", mimeType: null, fileSize: null }],
    });
    render(<AnswerView question={q} answer={answer} />);
    const link = screen.getByRole("link", { name: /resume\.pdf/ });
    expect(link).toHaveAttribute("href", resolveFileUrl("/uploads/others/resume.pdf"));
  });

  it("renders a dash when a file_upload question has no attachments", () => {
    render(<AnswerView question={baseQuestion({ type: "file_upload" })} answer={baseAnswer()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders multiple_choice_grid answers as a table with selections marked, not raw JSON", () => {
    const q = baseQuestion({
      type: "multiple_choice_grid",
      config: { columns: ["Col A", "Col B"] },
      options: [option({ id: 1, label: "Row 1", value: "row1" })],
    });
    const answer = baseAnswer({ value: { row1: "Col B" } });
    render(<AnswerView question={q} answer={answer} />);
    expect(screen.getByText("Row 1")).toBeInTheDocument();
    expect(screen.getByText("Col A")).toBeInTheDocument();
    expect(screen.getByText("Col B")).toBeInTheDocument();
    expect(screen.queryByText(/{"row1"/)).not.toBeInTheDocument();
    const cells = screen.getAllByRole("cell");
    const checkedCell = cells.find((c) => c.textContent === "✓");
    expect(checkedCell).toBeDefined();
  });

  it("renders checkbox_grid answers marking every selected column per row", () => {
    const q = baseQuestion({
      type: "checkbox_grid",
      config: { columns: ["Col A", "Col B"] },
      options: [option({ id: 1, label: "Row 1", value: "row1" })],
    });
    const answer = baseAnswer({ value: { row1: ["Col A", "Col B"] } });
    render(<AnswerView question={q} answer={answer} />);
    const cells = screen.getAllByRole("cell");
    const checkedCells = cells.filter((c) => c.textContent === "✓");
    expect(checkedCells).toHaveLength(2);
  });
});
