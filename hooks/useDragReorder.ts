'use client';

import { useState, type DragEvent } from 'react';

/**
 * Generic drag-and-drop reorder hook for a flat list, built on native HTML5 drag events (no
 * dnd-kit/react-beautiful-dnd dependency — this repo has none and the plan explicitly avoids
 * adding one). The parent still owns `items`/`onChange`; this only owns the transient
 * armed/dragFrom/dragOver interaction state.
 *
 * Also exposes a keyboard-accessible fallback (`moveUp`/`moveDown` + `canMoveUp`/`canMoveDown`)
 * since native HTML5 drag-and-drop has no keyboard path at all.
 */
export function useDragReorder<T>(items: T[], onChange: (next: T[]) => void) {
  const [armed, setArmed] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const moveTo = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (moved === undefined) return;
    next.splice(to, 0, moved);
    onChange(next);
  };

  const dragProps = (index: number) => ({
    draggable: armed === index,
    onDragStart: (e: DragEvent) => {
      setDragFrom(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: DragEvent) => {
      if (dragFrom == null) return;
      e.preventDefault();
      if (dragOver !== index) setDragOver(index);
    },
    onDragLeave: () => {
      if (dragOver === index) setDragOver(null);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragFrom != null) moveTo(dragFrom, index);
      setDragFrom(null);
      setDragOver(null);
      setArmed(null);
    },
    onDragEnd: () => {
      setDragFrom(null);
      setDragOver(null);
      setArmed(null);
    },
  });

  const handleProps = (index: number) => ({
    onMouseDown: () => setArmed(index),
    onMouseUp: () => setArmed(null),
    onTouchStart: () => setArmed(index),
  });

  return {
    dragProps,
    handleProps,
    isDragging: (index: number) => dragFrom === index,
    // The drop indicator hides on the source row itself — dropping "on yourself" is a no-op.
    isDropTarget: (index: number) => dragOver === index && dragFrom !== index,
    // Keyboard/screen-reader alternative to the pointer-only HTML5 drag above.
    canMoveUp: (index: number) => index > 0,
    canMoveDown: (index: number) => index < items.length - 1,
    moveUp: (index: number) => moveTo(index, index - 1),
    moveDown: (index: number) => moveTo(index, index + 1),
  };
}
