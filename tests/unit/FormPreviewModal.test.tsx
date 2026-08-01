import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormPreviewModal } from "@/components/forms/FormPreviewModal";

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

describe("FormPreviewModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <FormPreviewModal open={false} onClose={vi.fn()} title="Survey" description={null} sections={[]} questions={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a placeholder when there are no questions or sections", () => {
    render(<FormPreviewModal open onClose={vi.fn()} title="Survey" description={null} sections={[]} questions={[]} />);
    expect(screen.getByText("No questions yet.")).toBeInTheDocument();
  });

  it("renders the form title and description", () => {
    render(
      <FormPreviewModal open onClose={vi.fn()} title="My Survey" description="Please fill this out" sections={[]} questions={[]} />,
    );
    expect(screen.getByText("My Survey")).toBeInTheDocument();
    expect(screen.getByText("Please fill this out")).toBeInTheDocument();
  });

  it("renders section headers and rich text as static content, not form fields", () => {
    const questions = [
      question({ id: 1, type: "section_header", title: "Intro" }),
      question({ id: 2, type: "rich_text", title: "Some description text" }),
    ];
    render(<FormPreviewModal open onClose={vi.fn()} title="Survey" description={null} sections={[]} questions={questions} />);
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Some description text")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a required marker and description/help text for answerable questions", () => {
    const questions = [
      question({ id: 1, title: "Full name", required: true, description: "As per NIC", helpText: "e.g. John Doe" }),
    ];
    render(<FormPreviewModal open onClose={vi.fn()} title="Survey" description={null} sections={[]} questions={questions} />);
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("As per NIC")).toBeInTheDocument();
    expect(screen.getByText("e.g. John Doe")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("groups questions under their section, ordered after ungrouped questions", () => {
    const sections = [{ id: 10, formId: 1, title: "Section A", description: null, orderIndex: 0 }];
    const questions = [
      question({ id: 1, title: "Ungrouped", sectionId: null }),
      question({ id: 2, title: "Grouped", sectionId: 10 }),
    ];
    render(<FormPreviewModal open onClose={vi.fn()} title="Survey" description={null} sections={sections} questions={questions} />);
    expect(screen.getByText("Ungrouped")).toBeInTheDocument();
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Grouped")).toBeInTheDocument();
  });
});
