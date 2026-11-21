/** A width and height on screen, in pixels. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/** A box on screen, from the window's top left corner. */
export interface Box extends Size {
  readonly x: number;
  readonly y: number;
}

/** Which side of its anchor a floating surface prefers. */
export type FloatingSide = 'top' | 'bottom';
/** Which of the anchor's edges (or its middle) the surface lines up with. */
export type FloatingAlign = 'start' | 'center' | 'end';

export interface PlaceOptions {
  readonly side: FloatingSide;
  readonly align: FloatingAlign;
  /** Space between the anchor and the surface. */
  readonly sideOffset: number;
  /** The least space the surface keeps from the window's edges. */
  readonly collisionPadding: number;
}

/** Where a floating surface goes, from the window's top left corner, and how tall it may grow there. */
export interface Placement {
  readonly left: number;
  readonly top: number;
  readonly maxHeight: number;
  readonly side: FloatingSide;
}

/**
 * Where a surface of `size` goes beside `anchor` in a window of `window`'s
 * size: on its preferred side when it fits there or that side is the roomier,
 * otherwise on the other side, shrunk to the room there; lined up with the
 * anchor as `align` says, but kept inside the window. Pure, so both
 * platforms' layers share it.
 */
export function placeFloating(
  anchor: Box,
  size: Size,
  window: Size,
  { side, align, sideOffset, collisionPadding }: PlaceOptions,
): Placement {
  const room: Record<FloatingSide, number> = {
    bottom: window.height - (anchor.y + anchor.height) - sideOffset - collisionPadding,
    top: anchor.y - sideOffset - collisionPadding,
  };
  const other: FloatingSide = side === 'bottom' ? 'top' : 'bottom';
  const chosen =
    size.height <= room[side] || room[side] >= room[other] ? side : other;
  const maxHeight = Math.max(0, room[chosen]);
  const top =
    chosen === 'bottom'
      ? anchor.y + anchor.height + sideOffset
      : anchor.y - sideOffset - Math.min(size.height, maxHeight);
  const wanted =
    align === 'start'
      ? anchor.x
      : align === 'end'
        ? anchor.x + anchor.width - size.width
        : anchor.x + (anchor.width - size.width) / 2;
  const left = Math.max(
    collisionPadding,
    Math.min(wanted, window.width - size.width - collisionPadding),
  );
  return { left, top, maxHeight, side: chosen };
}
