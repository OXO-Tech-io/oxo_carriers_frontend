import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormOutline } from "@/components/forms/FormOutline";

const question = (patch: Partial<any> = {}) => ({
  id: 1,
  formId: 1,
  sectionId: null,
  type: "short_answer",
  title: "Question",
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

const section = (patch: Partial<any> = {}) => ({
  id: 10,
  formId: 1,
  title: "Section",
  description: null,
  orderIndex: 0,
  ...patch,
});

describe("FormOutline", () => {
  it("shows a placeholder message when there are no questions", () => {
    render(<FormOutline sections={[]} questions={[]} logicRules={[]} activeQuestionId={null} onActivate={vi.fn()} />);
    expect(screen.getByText("No questions yet. Add one to see it here.")).toBeInTheDocument();
  });

  it("shows the question count and an estimated completion time", () => {
    const questions = [question({ id: 1 }), question({ id: 2, title: "Q2" })];
    render(<FormOutline sections={[]} questions={questions} logicRules={[]} activeQuestionId={null} onActivate={vi.fn()} />);
    expect(screen.getByText("2 questions")).toBeInTheDocument();
    expect(screen.getByText(/~1 min/)).toBeInTheDocument();
  });

  it("warns about untitled and duplicate-titled questions", () => {
    const questions = [
      question({ id: 1, title: "" }),
      question({ id: 2, title: "Same" }),
      question({ id: 3, title: "Same" }),
    ];
    render(<FormOutline sections={[]} questions={questions} logicRules={[]} activeQuestionId={null} onActivate={vi.fn()} />);
    expect(screen.getByText("1 untitled question")).toBeInTheDocument();
    expect(screen.getByText("1 duplicate question title")).toBeInTheDocument();
  });

  it("warns about broken logic rules referencing missing questions", () => {
    const questions = [question({ id: 1 })];
    const logicRules = [
      {
        id: 1,
        formId: 1,
        targetQuestionId: 1,
        sourceQuestionId: 999, // doesn't exist
        comparator: "equals",
        comparisonValue: "x",
        action: "show",
        combinator: "all",
        orderIndex: 0,
      },
    ];
    render(<FormOutline sections={[]} questions={questions} logicRules={logicRules as any} activeQuestionId={null} onActivate={vi.fn()} />);
    expect(screen.getByText("1 logic rule needs attention")).toBeInTheDocument();
  });

  it("groups questions under their section and lists ungrouped questions separately", () => {
    const questions = [
      question({ id: 1, title: "Ungrouped Q", sectionId: null }),
      question({ id: 2, title: "Grouped Q", sectionId: 10 }),
    ];
    render(
      <FormOutline
        sections={[section({ id: 10, title: "My Section" })]}
        questions={questions}
        logicRules={[]}
        activeQuestionId={null}
        onActivate={vi.fn()}
      />,
    );
    expect(screen.getByText("Ungrouped Q")).toBeInTheDocument();
    expect(screen.getByText("My Section")).toBeInTheDocument();
    expect(screen.getByText("Grouped Q")).toBeInTheDocument();
  });

  it("calls onActivate when a question row is clicked", () => {
    const onActivate = vi.fn();
    const questions = [question({ id: 5, title: "Click me" })];
    render(<FormOutline sections={[]} questions={questions} logicRules={[]} activeQuestionId={null} onActivate={onActivate} />);
    fireEvent.click(screen.getByText("Click me"));
    expect(onActivate).toHaveBeenCalledWith(5);
  });

  it("filters visible questions by the search query", () => {
    const questions = [question({ id: 1, title: "Apple" }), question({ id: 2, title: "Banana" })];
    render(<FormOutline sections={[]} questions={questions} logicRules={[]} activeQuestionId={null} onActivate={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Search questions…"), { target: { value: "app" } });
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });
});
