import type { CanvasElement } from '@/types';

export const SNAP_THRESHOLD = 6;
export const SNAP_LOCK_THRESHOLD = 15;

export interface GuideLine {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  color?: string;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: GuideLine[];
}

export interface SnapContext {
  lockedVertical: { position: number } | null;
  lockedHorizontal: { position: number } | null;
}

export function createInitialSnapContext(): SnapContext {
  return { lockedVertical: null, lockedHorizontal: null };
}

export function getElementDimensions(elements: CanvasElement[]): {
  widths: number[];
  heights: number[];
  minX: number;
  minY: number;
} {
  const minX = Math.min(...elements.map((el) => el.x));
  const minY = Math.min(...elements.map((el) => el.y));
  return {
    widths: elements.map((el) => el.width),
    heights: elements.map((el) => el.height),
    minX,
    minY,
  };
}

function buildBox(
  elements: CanvasElement[],
  targetX: number,
  targetY: number
): BoundingBox {
  if (elements.length === 0) {
    return {
      left: targetX,
      top: targetY,
      right: targetX,
      bottom: targetY,
      width: 0,
      height: 0,
      centerX: targetX,
      centerY: targetY,
    };
  }

  if (elements.length === 1) {
    const el = elements[0];
    const left = targetX;
    const top = targetY;
    return {
      left,
      top,
      right: left + el.width,
      bottom: top + el.height,
      width: el.width,
      height: el.height,
      centerX: left + el.width / 2,
      centerY: top + el.height / 2,
    };
  }

  const originalMinX = Math.min(...elements.map((el) => el.x));
  const originalMinY = Math.min(...elements.map((el) => el.y));
  const originalMaxX = Math.max(...elements.map((el) => el.x + el.width));
  const originalMaxY = Math.max(...elements.map((el) => el.y + el.height));
  const offsetX = targetX - originalMinX;
  const offsetY = targetY - originalMinY;

  return {
    left: targetX,
    top: targetY,
    right: originalMaxX + offsetX,
    bottom: originalMaxY + offsetY,
    width: originalMaxX - originalMinX,
    height: originalMaxY - originalMinY,
    centerX: (originalMinX + originalMaxX) / 2 + offsetX,
    centerY: (originalMinY + originalMaxY) / 2 + offsetY,
  };
}

interface RefLine {
  position: number;
  refMin: number;
  refMax: number;
}

function collectVerticalRefs(
  allElements: CanvasElement[],
  draggingIds: Set<string>,
  canvasWidth: number,
  canvasHeight: number
): RefLine[] {
  const refs: RefLine[] = [
    { position: 0, refMin: 0, refMax: canvasHeight },
    { position: canvasWidth / 2, refMin: 0, refMax: canvasHeight },
    { position: canvasWidth, refMin: 0, refMax: canvasHeight },
  ];
  for (const el of allElements) {
    if (draggingIds.has(el.id)) continue;
    refs.push({ position: el.x, refMin: el.y, refMax: el.y + el.height });
    refs.push({ position: el.x + el.width / 2, refMin: el.y, refMax: el.y + el.height });
    refs.push({ position: el.x + el.width, refMin: el.y, refMax: el.y + el.height });
  }
  return refs;
}

function collectHorizontalRefs(
  allElements: CanvasElement[],
  draggingIds: Set<string>,
  canvasWidth: number,
  canvasHeight: number
): RefLine[] {
  const refs: RefLine[] = [
    { position: 0, refMin: 0, refMax: canvasWidth },
    { position: canvasHeight / 2, refMin: 0, refMax: canvasWidth },
    { position: canvasHeight, refMin: 0, refMax: canvasWidth },
  ];
  for (const el of allElements) {
    if (draggingIds.has(el.id)) continue;
    refs.push({ position: el.y, refMin: el.x, refMax: el.x + el.width });
    refs.push({ position: el.y + el.height / 2, refMin: el.x, refMax: el.x + el.width });
    refs.push({ position: el.y + el.height, refMin: el.x, refMax: el.x + el.width });
  }
  return refs;
}

function findNearestEdge(
  boxEdges: { position: number }[],
  targetPosition: number
): number {
  let best = boxEdges[0].position;
  let bestDiff = Math.abs(best - targetPosition);
  for (let i = 1; i < boxEdges.length; i++) {
    const diff = Math.abs(boxEdges[i].position - targetPosition);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = boxEdges[i].position;
    }
  }
  return best;
}

export function computeSnapFromPosition(
  draggingElements: CanvasElement[],
  allElements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  rawX: number,
  rawY: number,
  context: SnapContext
): { result: SnapResult; newContext: SnapContext } {
  const draggingIds = new Set(draggingElements.map((el) => el.id));
  const box = buildBox(draggingElements, rawX, rawY);
  const vRefs = collectVerticalRefs(allElements, draggingIds, canvasWidth, canvasHeight);
  const hRefs = collectHorizontalRefs(allElements, draggingIds, canvasWidth, canvasHeight);

  const guides: GuideLine[] = [];
  let finalX = rawX;
  let finalY = rawY;
  let newLockedV: { position: number } | null = null;
  let newLockedH: { position: number } | null = null;

  const vEdges = [
    { position: box.left },
    { position: box.centerX },
    { position: box.right },
  ];
  const hEdges = [
    { position: box.top },
    { position: box.centerY },
    { position: box.bottom },
  ];

  // --- Vertical ---
  if (context.lockedVertical) {
    const lockPos = context.lockedVertical.position;
    const nearest = findNearestEdge(vEdges, lockPos);
    const dist = Math.abs(nearest - lockPos);
    if (dist < SNAP_LOCK_THRESHOLD) {
      newLockedV = { position: lockPos };
      finalX = rawX + (lockPos - nearest);
      const refLine = vRefs.find((r) => Math.abs(r.position - lockPos) < 0.5);
      if (refLine) {
        guides.push({
          type: 'vertical',
          position: lockPos,
          start: Math.min(refLine.refMin, box.top),
          end: Math.max(refLine.refMax, box.bottom),
          color: '#f43f5e',
        });
      }
    }
  }

  if (!newLockedV) {
    let bestDiff = SNAP_THRESHOLD + 1;
    let bestSnap: { position: number; refLine: RefLine; adj: number } | null = null;
    for (const ref of vRefs) {
      for (const edge of vEdges) {
        const diff = Math.abs(edge.position - ref.position);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSnap = { position: ref.position, refLine: ref, adj: ref.position - edge.position };
        }
      }
    }
    if (bestSnap) {
      newLockedV = { position: bestSnap.position };
      finalX = rawX + bestSnap.adj;
      guides.push({
        type: 'vertical',
        position: bestSnap.position,
        start: Math.min(bestSnap.refLine.refMin, box.top),
        end: Math.max(bestSnap.refLine.refMax, box.bottom),
        color: '#f43f5e',
      });
    }
  }

  // --- Horizontal ---
  if (context.lockedHorizontal) {
    const lockPos = context.lockedHorizontal.position;
    const nearest = findNearestEdge(hEdges, lockPos);
    const dist = Math.abs(nearest - lockPos);
    if (dist < SNAP_LOCK_THRESHOLD) {
      newLockedH = { position: lockPos };
      finalY = rawY + (lockPos - nearest);
      const refLine = hRefs.find((r) => Math.abs(r.position - lockPos) < 0.5);
      if (refLine) {
        guides.push({
          type: 'horizontal',
          position: lockPos,
          start: Math.min(refLine.refMin, box.left),
          end: Math.max(refLine.refMax, box.right),
          color: '#f43f5e',
        });
      }
    }
  }

  if (!newLockedH) {
    let bestDiff = SNAP_THRESHOLD + 1;
    let bestSnap: { position: number; refLine: RefLine; adj: number } | null = null;
    for (const ref of hRefs) {
      for (const edge of hEdges) {
        const diff = Math.abs(edge.position - ref.position);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSnap = { position: ref.position, refLine: ref, adj: ref.position - edge.position };
        }
      }
    }
    if (bestSnap) {
      newLockedH = { position: bestSnap.position };
      finalY = rawY + bestSnap.adj;
      guides.push({
        type: 'horizontal',
        position: bestSnap.position,
        start: Math.min(bestSnap.refLine.refMin, box.left),
        end: Math.max(bestSnap.refLine.refMax, box.right),
        color: '#f43f5e',
      });
    }
  }

  return {
    result: { snappedX: finalX, snappedY: finalY, guides },
    newContext: { lockedVertical: newLockedV, lockedHorizontal: newLockedH },
  };
}
