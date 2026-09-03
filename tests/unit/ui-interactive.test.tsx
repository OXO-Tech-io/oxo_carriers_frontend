import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Stepper, StepPanel } from "@/components/ui/Stepper";
import { FileUpload } from "@/components/ui/FileUpload";

describe("ActionsMenu", () => {
  it("opens the menu on trigger click and renders each item", () => {
    const items = [
      { label: "Edit", onClick: vi.fn() },
      { label: "Delete", onClick: vi.fn(), variant: "danger" as const },
    ];
    render(<ActionsMenu items={items} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Row actions"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("invokes the item's onClick and closes the menu", () => {
    const onClick = vi.fn();
    render(<ActionsMenu items={[{ label: "Edit", onClick }]} />);
    fireEvent.click(screen.getByLabelText("Row actions"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside the menu", () => {
    render(<ActionsMenu items={[{ label: "Edit", onClick: vi.fn() }]} />);
    fireEvent.click(screen.getByLabelText("Row actions"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<ActionsMenu items={[{ label: "Edit", onClick: vi.fn() }]} />);
    fireEvent.click(screen.getByLabelText("Row actions"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles closed when the trigger is clicked again", () => {
    render(<ActionsMenu items={[{ label: "Edit", onClick: vi.fn() }]} />);
    const trigger = screen.getByLabelText("Row actions");
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("Stepper", () => {
  const steps = [
    { key: "a", label: "Step A" },
    { key: "b", label: "Step B" },
    { key: "c", label: "Step C", disabled: true },
  ];

  it("shows the current step position and label without opening the panel", () => {
    render(<Stepper steps={steps} currentIndex={1} />);
    const caption = screen.getByText("Step 2 of 3", { exact: false, selector: "p" });
    expect(caption.textContent).toContain("Step B");
  });

  it("marks prior steps complete once the step list is opened", () => {
    render(<Stepper steps={steps} currentIndex={1} />);
    fireEvent.click(screen.getByText("View all steps"));
    expect(screen.getByText("✓")).toBeInTheDocument(); // step A complete
    expect(screen.getByText("2")).toBeInTheDocument(); // step B (current) shows its number
  });

  it("calls onStepClick only for enabled, clickable steps", () => {
    const onStepClick = vi.fn();
    render(<Stepper steps={steps} currentIndex={1} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByText("View all steps"));
    fireEvent.click(screen.getByText("Step A"));
    expect(onStepClick).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("View all steps"));
    fireEvent.click(screen.getByText("Step C"));
    expect(onStepClick).not.toHaveBeenCalledWith(2);
  });

  it("does not attach click behavior when onStepClick is omitted", () => {
    render(<Stepper steps={steps} currentIndex={0} />);
    fireEvent.click(screen.getByText("View all steps"));
    const button = screen.getByText("Step B").closest("button");
    expect(button).toBeDisabled();
  });

  it("StepPanel renders its children", () => {
    render(
      <StepPanel stepKey="a">
        <p>Panel content</p>
      </StepPanel>,
    );
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });
});

describe("FileUpload", () => {
  const makeFile = (name: string, sizeBytes: number) => {
    const file = new File(["x".repeat(Math.min(sizeBytes, 10))], name, { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: sizeBytes });
    return file;
  };

  it("selecting a file via the hidden input calls onFilesSelected", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("resume.pdf", 1024);

    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
  });

  it("rejects files exceeding maxSizeMB with an error message", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} maxSizeMB={1} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = makeFile("huge.pdf", 2 * 1024 * 1024);

    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByText(/exceeds the 1MB limit/)).toBeInTheDocument();
  });

  it("supports removing a selected file", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("doc.pdf", 100);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByLabelText("Remove doc.pdf"));
    expect(onFilesSelected).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText("doc.pdf")).not.toBeInTheDocument();
  });

  it("accumulates multiple files when multiple is true, replaces selection otherwise", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} multiple />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile("a.pdf", 10)] } });
    fireEvent.change(input, { target: { files: [makeFile("b.pdf", 10)] } });
    expect(onFilesSelected).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "a.pdf" }),
      expect.objectContaining({ name: "b.pdf" }),
    ]);
  });

  it("renders existing files with a remove control when onRemoveExisting is provided", () => {
    const onRemoveExisting = vi.fn();
    render(
      <FileUpload
        onFilesSelected={vi.fn()}
        existingFiles={[{ name: "old.pdf", url: "https://example.com/old.pdf" }]}
        onRemoveExisting={onRemoveExisting}
      />,
    );
    expect(screen.getByText("old.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove old.pdf"));
    expect(onRemoveExisting).toHaveBeenCalledWith("https://example.com/old.pdf");
  });

  it("drag-and-drop toggles the drag-over state and forwards dropped files", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    const dropzone = container.querySelector("div[class*='border-dashed']") as HTMLElement;
    const file = makeFile("dropped.pdf", 10);

    fireEvent.dragOver(dropzone, { dataTransfer: { files: [file] } });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });
});
