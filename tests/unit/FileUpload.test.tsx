import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUpload } from "@/components/ui/FileUpload";

const makeFile = (name: string, type: string) => new File(["content"], name, { type });

describe("FileUpload", () => {
  it("accepts a file matching an exact mime type in `accept`", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload accept="application/pdf" onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("doc.pdf", "application/pdf")] } });
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "doc.pdf" })]);
    expect(screen.queryByText(/not a supported file type/i)).not.toBeInTheDocument();
  });

  it("accepts a file matching a wildcard mime rule such as image/*", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload accept="image/*" onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("photo.png", "image/png")] } });
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "photo.png" })]);
  });

  it("rejects a file whose type is not in `accept` and does not call onFilesSelected", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload accept="image/jpeg,image/png" onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("malware.exe", "application/x-msdownload")] } });
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByText(/not a supported file type/i)).toBeInTheDocument();
  });

  it("shows a custom typeErrorMessage when provided", () => {
    render(
      <FileUpload
        accept="image/jpeg,image/png,application/pdf"
        typeErrorMessage="Invalid file type. Only JPG, PNG, and PDF files are allowed."
        onFilesSelected={vi.fn()}
      />,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("sheet.csv", "text/csv")] } });
    expect(screen.getByText("Invalid file type. Only JPG, PNG, and PDF files are allowed.")).toBeInTheDocument();
  });

  it("still allows any file type when `accept` is omitted", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("anything.xyz", "application/octet-stream")] } });
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "anything.xyz" })]);
  });

  it("matches an extension-based rule (e.g. .docx) when the mime type is generic", () => {
    const onFilesSelected = vi.fn();
    render(<FileUpload accept=".doc,.docx" onFilesSelected={onFilesSelected} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("resume.docx", "")] } });
    expect(onFilesSelected).toHaveBeenCalledWith([expect.objectContaining({ name: "resume.docx" })]);
  });
});
