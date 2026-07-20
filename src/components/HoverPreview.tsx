'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type HoverPreviewProps = {
  /** The inline element the user hovers over to reveal the preview. */
  trigger: ReactNode;
  /** Any component/content of your choosing, rendered inside the box. */
  children: ReactNode;
};

type Position = {
  placeAbove: boolean;
  /** left offset of the box, relative to the wrapper */
  left: number;
  /** height cap so the box always fits the chosen side */
  maxHeight: number;
};

const MARGIN = 8; // keep at least this far from the viewport edge
const BRIDGE = 8; // transparent hover bridge between trigger and box (~0.5rem)

/**
 * A reusable Wikipedia/Quartz-style hover preview. Hovering the trigger fades
 * in a scrollable popover box holding whatever content you pass as children.
 * The box positions itself against the viewport: it flips above/below based on
 * where there's more room, and is centered on the trigger then clamped left or
 * right so it never runs off screen. Box chrome lives in globals.css under
 * `.hover-preview` / `.popover` / `.popover-inner`.
 */
export default function HoverPreview({ trigger, children }: HoverPreviewProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  const compute = useCallback(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    const w = wrapper.getBoundingClientRect();
    const boxWidth = inner.getBoundingClientRect().width;
    // scrollHeight is the full content height, independent of the current cap,
    // so repeated measurements don't shrink the box.
    const contentHeight = inner.scrollHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rem =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const capPx = Math.min(20 * rem, vh * 0.6);
    const desiredHeight = Math.min(contentHeight, capPx);

    // vertical: prefer the side it fits; otherwise the side with more room.
    const spaceBelow = vh - w.bottom;
    const spaceAbove = w.top;
    const needed = desiredHeight + BRIDGE;
    let placeAbove: boolean;
    if (spaceBelow >= needed) placeAbove = false;
    else if (spaceAbove >= needed) placeAbove = true;
    else placeAbove = spaceAbove > spaceBelow;

    const room = (placeAbove ? spaceAbove : spaceBelow) - BRIDGE - MARGIN;
    const maxHeight = Math.max(120, Math.min(desiredHeight, room));

    // horizontal: center on the trigger, then clamp inside the viewport.
    let leftVp = w.left + w.width / 2 - boxWidth / 2;
    if (boxWidth >= vw - MARGIN * 2) {
      leftVp = MARGIN; // wider than the screen: pin to the left margin
    } else {
      leftVp = Math.min(Math.max(leftVp, MARGIN), vw - MARGIN - boxWidth);
    }

    setPos({ placeAbove, left: leftVp - w.left, maxHeight });
  }, []);

  const handleEnter = useCallback(() => {
    compute();
    setOpen(true);
  }, [compute]);

  const handleLeave = useCallback(() => setOpen(false), []);

  // keep it anchored while the user scrolls or resizes with it open
  useEffect(() => {
    if (!open) return;
    const onChange = () => compute();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open, compute]);

  const popoverStyle: CSSProperties = pos
    ? pos.placeAbove
      ? {
          left: pos.left,
          top: 'auto',
          bottom: '100%',
          paddingTop: 0,
          paddingBottom: BRIDGE,
        }
      : {
          left: pos.left,
          top: '100%',
          bottom: 'auto',
          paddingTop: BRIDGE,
          paddingBottom: 0,
        }
    : {};

  const innerStyle: CSSProperties = pos ? { maxHeight: pos.maxHeight } : {};

  return (
    <span
      ref={wrapperRef}
      className="hover-preview"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="hover-preview-trigger">{trigger}</span>
      <span
        className="popover"
        role="tooltip"
        data-open={open ? 'true' : 'false'}
        style={popoverStyle}
      >
        <span ref={innerRef} className="popover-inner" style={innerStyle}>
          {children}
        </span>
      </span>
    </span>
  );
}
