import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StepSlider, type StepSliderOption } from "@/components/ui/StepSlider";

type Level = "low" | "mid" | "high";

const OPTIONS: StepSliderOption<Level>[] = [
  { value: "low", label: "Low", color: "green" },
  { value: "mid", label: "Mid", color: "orange" },
  { value: "high", label: "High", color: "red" },
];

// jsdom has no layout, so give the track a 100px width (16px thumb => 84px of
// travel: steps sit at x = 8, 50, 92) starting at x = 0.
function mockTrackRect(slider: HTMLElement) {
  slider.getBoundingClientRect = () =>
    ({ left: 0, right: 100, width: 100, top: 0, bottom: 20, height: 20, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
}

function setup(props: Partial<React.ComponentProps<typeof StepSlider<Level>>> = {}) {
  const onChange = vi.fn();
  render(<StepSlider options={OPTIONS} value="low" onChange={onChange} ariaLabel="Level" {...props} />);
  return { onChange, slider: screen.getByRole("slider", { name: "Level" }) };
}

describe("StepSlider", () => {
  it("renders one dot per option and shows the selected label", () => {
    setup({ value: "mid" });
    expect(screen.getAllByTestId("step-slider-dot")).toHaveLength(3);
    expect(screen.getByText("Mid")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "2");
  });

  // The slider locks while a change is pending (onChange is awaited), so
  // consecutive key presses need to wait for it to settle first.
  const settled = (slider: HTMLElement) =>
    waitFor(() => expect(slider).toHaveAttribute("aria-disabled", "false"));

  it("moves one step with the arrow keys", async () => {
    const { onChange, slider } = setup({ value: "mid" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("high");
    await settled(slider);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("low");
  });

  it("does not call onChange when already at the end in that direction", () => {
    const { onChange, slider } = setup({ value: "high" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("jumps with Home / End", async () => {
    const { onChange, slider } = setup({ value: "mid" });
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("high");
    await settled(slider);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("low");
  });

  it("selects the nearest step when the track is clicked, on release", () => {
    const { onChange, slider } = setup();
    mockTrackRect(slider);
    fireEvent.pointerDown(slider, { clientX: 52 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider, { clientX: 52 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("mid");
  });

  it("commits only the step it is released on when dragged across several", () => {
    const { onChange, slider } = setup();
    mockTrackRect(slider);
    fireEvent.pointerDown(slider, { clientX: 8 });
    fireEvent.pointerMove(slider, { clientX: 50 });
    fireEvent.pointerMove(slider, { clientX: 95 });
    expect(slider).toHaveAttribute("aria-valuetext", "High");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider, { clientX: 95 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("high");
  });

  it("ignores a drag that is released back on the current step", () => {
    const { onChange, slider } = setup();
    mockTrackRect(slider);
    fireEvent.pointerDown(slider, { clientX: 90 });
    fireEvent.pointerMove(slider, { clientX: 4 });
    fireEvent.pointerUp(slider, { clientX: 4 });
    expect(onChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuetext", "Low");
  });

  it("holds the chosen step while onChange is pending, then returns to value", async () => {
    let resolve!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const { slider } = setup({ onChange });

    fireEvent.keyDown(slider, { key: "End" });
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "High"));
    expect(slider).toHaveAttribute("aria-disabled", "true");

    // Locked: further input is ignored while the change is in flight.
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(slider).toHaveAttribute("aria-valuetext", "Low"));
    expect(slider).toHaveAttribute("aria-disabled", "false");
  });

  it("ignores all input when disabled", () => {
    const { onChange, slider } = setup({ disabled: true });
    mockTrackRect(slider);
    fireEvent.keyDown(slider, { key: "End" });
    fireEvent.pointerDown(slider, { clientX: 95 });
    fireEvent.pointerUp(slider, { clientX: 95 });
    expect(onChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("tabindex", "-1");
  });
});
