import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDragReorder } from "@/hooks/useDragReorder";

describe("useDragReorder", () => {
  const setup = (items = ["a", "b", "c"]) => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ items }) => useDragReorder(items, onChange),
      { initialProps: { items } },
    );
    return { result, rerender, onChange };
  };

  it("canMoveUp/canMoveDown reflect position within the list", () => {
    const { result } = setup();
    expect(result.current.canMoveUp(0)).toBe(false);
    expect(result.current.canMoveUp(1)).toBe(true);
    expect(result.current.canMoveDown(2)).toBe(false);
    expect(result.current.canMoveDown(1)).toBe(true);
  });

  it("moveUp swaps the item with its predecessor via onChange", () => {
    const { result, onChange } = setup();
    act(() => result.current.moveUp(1));
    expect(onChange).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("moveDown swaps the item with its successor via onChange", () => {
    const { result, onChange } = setup();
    act(() => result.current.moveDown(0));
    expect(onChange).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("dropping an item back onto its own source index is a no-op", () => {
    const { result, onChange } = setup();
    act(() => {
      result.current.dragProps(1).onDragStart({ dataTransfer: {} } as any);
    });
    act(() => {
      result.current.dragProps(1).onDrop({ preventDefault: vi.fn() } as any);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("isDragging/isDropTarget reflect drag state changes from dragProps handlers", () => {
    const { result } = setup();
    expect(result.current.isDragging(0)).toBe(false);

    const dragStartProps = result.current.dragProps(0);
    const fakeDataTransfer: any = {};
    act(() => {
      dragStartProps.onDragStart({ dataTransfer: fakeDataTransfer } as any);
    });
    expect(fakeDataTransfer.effectAllowed).toBe("move");
    expect(result.current.isDragging(0)).toBe(true);

    act(() => {
      result.current.dragProps(1).onDragOver({ preventDefault: vi.fn() } as any);
    });
    expect(result.current.isDropTarget(1)).toBe(true);
    // Dropping on the source row itself is never a valid drop target.
    expect(result.current.isDropTarget(0)).toBe(false);

    act(() => {
      // Re-fetch dragProps(1) so its closure sees the current dragOver state
      // (the props object grabbed before the state update above is stale).
      result.current.dragProps(1).onDragLeave();
    });
    expect(result.current.isDropTarget(1)).toBe(false);
  });

  it("onDrop reorders via moveTo and clears drag state", () => {
    const { result, onChange } = setup();
    act(() => {
      result.current.dragProps(0).onDragStart({ dataTransfer: {} } as any);
    });
    act(() => {
      result.current.dragProps(2).onDrop({ preventDefault: vi.fn() } as any);
    });
    expect(onChange).toHaveBeenCalledWith(["b", "c", "a"]);
    expect(result.current.isDragging(0)).toBe(false);
  });

  it("onDragEnd resets drag state without calling onChange", () => {
    const { result, onChange } = setup();
    act(() => {
      result.current.dragProps(0).onDragStart({ dataTransfer: {} } as any);
    });
    act(() => {
      result.current.dragProps(0).onDragEnd();
    });
    expect(result.current.isDragging(0)).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handleProps arms/disarms drag via mouse and touch events, gating draggable", () => {
    const { result } = setup();
    expect(result.current.dragProps(0).draggable).toBe(false);
    act(() => result.current.handleProps(0).onMouseDown());
    expect(result.current.dragProps(0).draggable).toBe(true);
    act(() => result.current.handleProps(0).onMouseUp());
    expect(result.current.dragProps(0).draggable).toBe(false);
    act(() => result.current.handleProps(0).onTouchStart());
    expect(result.current.dragProps(0).draggable).toBe(true);
  });
});
