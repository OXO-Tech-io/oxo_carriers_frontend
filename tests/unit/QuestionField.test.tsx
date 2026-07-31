import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionField } from "@/components/forms/QuestionField";
import type { FormQuestion } from "@/types/hrModules";

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

describe("QuestionField", () => {
  it("short_answer renders a text input and reports changes", () => {
    const onChange = vi.fn();
    render(<QuestionField question={baseQuestion()} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });
    expect(onChange).toHaveBeenCalledWith("hi");
  });

  it("paragraph renders a textarea", () => {
    render(<QuestionField question={baseQuestion({ type: "paragraph" })} value="x" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
  });

  it("number renders a number input and converts entered text to a Number", () => {
    const onChange = vi.fn();
    const { container } = render(
      <QuestionField question={baseQuestion({ type: "number" })} value={undefined} onChange={onChange} />,
    );
    const input = container.querySelector('input[type="number"]')!;
    fireEvent.change(input, { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("number clears to undefined when the field is emptied", () => {
    // Rendered with a starting numeric value (rather than reusing the input from the case above)
    // so this is a real controlled-input transition, not a stale-DOM-value artifact of two
    // fireEvent.change calls against the same uncontrolled test harness.
    const onChange = vi.fn();
    const { container } = render(
      <QuestionField question={baseQuestion({ type: "number" })} value={5} onChange={onChange} />,
    );
    const input = container.querySelector('input[type="number"]')!;
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("dropdown lists the question's options and reports selection", () => {
    const onChange = vi.fn();
    const q = baseQuestion({ type: "dropdown", options: [option({ id: 1, label: "A", value: "a" }), option({ id: 2, label: "B", value: "b" })] });
    render(<QuestionField question={q} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("yes_no renders two radio options and selects one", () => {
    const onChange = vi.fn();
    render(<QuestionField question={baseQuestion({ type: "yes_no" })} value="" onChange={onChange} />);
    fireEvent.click(screen.getByText("Yes"));
    expect(onChange).toHaveBeenCalledWith("Yes");
  });

  it("multiple_choice selects one of the option radios", () => {
    const onChange = vi.fn();
    const q = baseQuestion({ type: "multiple_choice", options: [option({ id: 1, label: "A", value: "a" }), option({ id: 2, label: "B", value: "b" })] });
    render(<QuestionField question={q} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText("B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("multiple_choice with allowOther reveals a free-text field", () => {
    const onChange = vi.fn();
    const q = baseQuestion({
      type: "multiple_choice",
      config: { allowOther: true },
      options: [option({ id: 1, label: "A", value: "a" })],
    });
    render(<QuestionField question={q} value="custom answer" onChange={onChange} />);
    expect(screen.getByText("Other:")).toBeInTheDocument();
    const otherInput = screen.getByDisplayValue("custom answer");
    fireEvent.change(otherInput, { target: { value: "new" } });
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("checkboxes toggles values in and out of the array", () => {
    const onChange = vi.fn();
    const q = baseQuestion({ type: "checkboxes", options: [option({ id: 1, label: "A", value: "a" }), option({ id: 2, label: "B", value: "b" })] });
    render(<QuestionField question={q} value={["a"]} onChange={onChange} />);
    fireEvent.click(screen.getByText("B"));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    fireEvent.click(screen.getByText("A"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("linear_scale renders a step for each value in range and selects one", () => {
    const onChange = vi.fn();
    const q = baseQuestion({ type: "linear_scale", config: { min: 1, max: 3, minLabel: "Low", maxLabel: "High" } });
    render(<QuestionField question={q} value={undefined} onChange={onChange} />);
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("rating renders stars up to max and reports the clicked value", () => {
    const onChange = vi.fn();
    const q = baseQuestion({ type: "rating", config: { max: 5 } });
    render(<QuestionField question={q} value={0} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Rate 3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("multiple_choice_grid sets a single value per row", () => {
    const onChange = vi.fn();
    const q = baseQuestion({
      type: "multiple_choice_grid",
      config: { columns: ["Col1", "Col2"] },
      options: [option({ id: 1, label: "Row1", value: "row1" })],
    });
    render(<QuestionField question={q} value={{}} onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith({ row1: "Col2" });
  });

  it("checkbox_grid accumulates multiple selections per row", () => {
    const onChange = vi.fn();
    const q = baseQuestion({
      type: "checkbox_grid",
      config: { columns: ["Col1", "Col2"] },
      options: [option({ id: 1, label: "Row1", value: "row1" })],
    });
    render(<QuestionField question={q} value={{ row1: ["Col1"] }} onChange={onChange} />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith({ row1: ["Col1", "Col2"] });
  });

  it("file_upload shows the existing file name and reports a newly selected file", () => {
    const onFileChange = vi.fn();
    const q = baseQuestion({ type: "file_upload" });
    const { container } = render(
      <QuestionField question={q} value={null} onChange={vi.fn()} existingFileName="resume.pdf" onFileChange={onFileChange} />,
    );
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "new.pdf");
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileChange).toHaveBeenCalledWith(file);
  });

  it("disables inputs when disabled is true", () => {
    render(<QuestionField question={baseQuestion()} value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("returns null for an unknown type", () => {
    const { container } = render(
      <QuestionField question={baseQuestion({ type: "unknown_type" as any })} value="" onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
