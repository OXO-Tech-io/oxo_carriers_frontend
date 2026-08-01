import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormLogicPanel } from "@/components/forms/FormLogicPanel";

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

const rule = (patch: Partial<any> = {}) => ({
  id: 1,
  formId: 1,
  targetQuestionId: 1,
  sourceQuestionId: 2,
  comparator: "equals",
  comparisonValue: "Yes",
  action: "show",
  combinator: "all",
  orderIndex: 0,
  ...patch,
});

describe("FormLogicPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <FormLogicPanel
        open={false}
        onClose={vi.fn()}
        question={question()}
        allQuestions={[question(), question({ id: 2, title: "Q2" })]}
        rules={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("prompts to add another question when there are no other sources", () => {
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question()}
        allQuestions={[question()]}
        rules={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Add another question to this form to condition this one on its answer."),
    ).toBeInTheDocument();
  });

  it("shows the always-visible message when there are sources but no rules yet", () => {
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question()}
        allQuestions={[question(), question({ id: 2, title: "Q2" })]}
        rules={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/Always visible/)).toBeInTheDocument();
  });

  it("adding a condition calls onAdd with the first candidate source", () => {
    const onAdd = vi.fn();
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" })]}
        rules={[]}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Add condition"));
    expect(onAdd).toHaveBeenCalledWith({
      targetQuestionId: 1,
      sourceQuestionId: 2,
      comparator: "equals",
      comparisonValue: "",
      action: "show",
      combinator: "all",
    });
  });

  it("renders an existing rule with its comparator, source and value", () => {
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" })]}
        rules={[rule()]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Yes")).toBeInTheDocument();
    expect(screen.getByText("Show if")).toBeInTheDocument();
  });

  it("toggling show/hide calls onUpdate with the new action", () => {
    const onUpdate = vi.fn();
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" })]}
        rules={[rule()]}
        onAdd={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Hide if"));
    expect(onUpdate).toHaveBeenCalledWith(1, { action: "hide" });
  });

  it("changing the comparator to is_empty hides the value input", () => {
    const onUpdate = vi.fn();
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" })]}
        rules={[rule({ comparator: "is_empty" })]}
        onAdd={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByPlaceholderText("Value")).not.toBeInTheDocument();
  });

  it("deleting a condition calls onDelete with the rule id", () => {
    const onDelete = vi.fn();
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" })]}
        rules={[rule()]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByLabelText("Remove condition"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows the all/any combinator toggle only when there are multiple rules", () => {
    render(
      <FormLogicPanel
        open
        onClose={vi.fn()}
        question={question({ id: 1 })}
        allQuestions={[question({ id: 1 }), question({ id: 2, title: "Q2" }), question({ id: 3, title: "Q3" })]}
        rules={[rule({ id: 1, sourceQuestionId: 2 }), rule({ id: 2, sourceQuestionId: 3 })]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("All conditions")).toBeInTheDocument();
    expect(screen.getByText("Any condition")).toBeInTheDocument();
  });
});
