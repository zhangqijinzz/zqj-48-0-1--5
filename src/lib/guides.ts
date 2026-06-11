import type { CanvasElement } from '@/types';

export const SNAP_THRESHOLD = 6;

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

export function getBoundingBox(elements: CanvasElement[]): BoundingBox {
  if (elements.length === 0) {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }

  const left = Math.min(...elements.map((el) => el.x));
  const top = Math.min(...elements.map((el) => el.y));
  const right = Math.max(...elements.map((el) => el.x + el.width));
  const bottom = Math.max(...elements.map((el) => el.y + el.height));
  const width = right - left;
  const height = bottom - top;

  return {
    left,
    top,
    right,
    bottom,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

export function getElementBox(element: CanvasElement, offsetX = 0, offsetY = 0): BoundingBox {
  const left = element.x + offsetX;
  const top = element.y + offsetY;
  const right = left + element.width;
  const bottom = top + element.height;
  return {
    left,
    top,
    right,
    bottom,
    width: element.width,
    height: element.height,
    centerX: left + element.width / 2,
    centerY: top + element.height / 2,
  };
}

export function computeSnap(
  draggingElements: CanvasElement[],
  allElements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): SnapResult {
  const guides: GuideLine[] = [];
  let finalOffsetX = offsetX;
  let finalOffsetY = offsetY;

  const draggingBox = (() => {
    if (draggingElements.length === 1) {
      return getElementBox(draggingElements[0], offsetX, offsetY);
    }
    const originalBox = getBoundingBox(draggingElements);
    return {
      left: originalBox.left + offsetX,
      top: originalBox.top + offsetY,
      right: originalBox.right + offsetX,
      bottom: originalBox.bottom + offsetY,
      width: originalBox.width,
      height: originalBox.height,
      centerX: originalBox.centerX + offsetX,
      centerY: originalBox.centerY + offsetY,
    };
  })();

  const otherElements = allElements.filter(
    (el) => !draggingElements.some((de) => de.id === el.id)
  );

  const canvasLines = {
    vertical: [0, canvasWidth / 2, canvasWidth],
    horizontal: [0, canvasHeight / 2, canvasHeight],
  };

  const otherBoxes = otherElements.map((el) => getElementBox(el));

  let bestVDiff = SNAP_THRESHOLD + 1;
  let bestVSnap: number | null = null;
  let bestVLine: { position: number; refMin: number; refMax: number } | null = null;

  for (const cl of canvasLines.vertical) {
    for (const [edge, dragPos] of [
      ['left', draggingBox.left],
      ['center', draggingBox.centerX],
      ['right', draggingBox.right],
    ] as const) {
      const diff = Math.abs(dragPos - cl);
      if (diff < bestVDiff) {
        bestVDiff = diff;
        const targetEdge = edge === 'left' ? draggingBox.left : edge === 'right' ? draggingBox.right : draggingBox.centerX;
        bestVSnap = offsetX + (cl - targetEdge);
        const refMin = Math.min(...canvasLines.horizontal);
        const refMax = Math.max(...canvasLines.horizontal);
        bestVLine = { position: cl, refMin, refMax };
      }
    }
  }

  for (const ob of otherBoxes) {
    const refEdges = [ob.left, ob.centerX, ob.right];
    const dragEdges = [draggingBox.left, draggingBox.centerX, draggingBox.right];
    for (let i = 0; i < dragEdges.length; i++) {
      for (let j = 0; j < refEdges.length; j++) {
        const diff = Math.abs(dragEdges[i] - refEdges[j]);
        if (diff < bestVDiff) {
          bestVDiff = diff;
          bestVSnap = offsetX + (refEdges[j] - dragEdges[i]);
          bestVLine = { position: refEdges[j], refMin: ob.top, refMax: ob.bottom };
        }
      }
    }
  }

  if (bestVSnap !== null && bestVLine) {
    finalOffsetX = bestVSnap;
    const refMin = Math.min(bestVLine.refMin, draggingBox.top);
    const refMax = Math.max(bestVLine.refMax, draggingBox.bottom);
    guides.push({
      type: 'vertical',
      position: bestVLine.position,
      start: refMin,
      end: refMax,
      color: '#f43f5e',
    });
  }

  let bestHDiff = SNAP_THRESHOLD + 1;
  let bestHSnap: number | null = null;
  let bestHLine: { position: number; refMin: number; refMax: number } | null = null;

  for (const cl of canvasLines.horizontal) {
    for (const [edge, dragPos] of [
      ['top', draggingBox.top],
      ['center', draggingBox.centerY],
      ['bottom', draggingBox.bottom],
    ] as const) {
      const diff = Math.abs(dragPos - cl);
      if (diff < bestHDiff) {
        bestHDiff = diff;
        const targetEdge = edge === 'top' ? draggingBox.top : edge === 'bottom' ? draggingBox.bottom : draggingBox.centerY;
        bestHSnap = offsetY + (cl - targetEdge);
        const refMin = Math.min(...canvasLines.vertical);
        const refMax = Math.max(...canvasLines.vertical);
        bestHLine = { position: cl, refMin, refMax };
      }
    }
  }

  for (const ob of otherBoxes) {
    const refEdges = [ob.top, ob.centerY, ob.bottom];
    const dragEdges = [draggingBox.top, draggingBox.centerY, draggingBox.bottom];
    for (let i = 0; i < dragEdges.length; i++) {
      for (let j = 0; j < refEdges.length; j++) {
        const diff = Math.abs(dragEdges[i] - refEdges[j]);
        if (diff < bestHDiff) {
          bestHDiff = diff;
          bestHSnap = offsetY + (refEdges[j] - dragEdges[i]);
          bestHLine = { position: refEdges[j], refMin: ob.left, refMax: ob.right };
        }
      }
    }
  }

  if (bestHSnap !== null && bestHLine) {
    finalOffsetY = bestHSnap;
    const refMin = Math.min(bestHLine.refMin, draggingBox.left);
    const refMax = Math.max(bestHLine.refMax, draggingBox.right);
    guides.push({
      type: 'horizontal',
      position: bestHLine.position,
      start: refMin,
      end: refMax,
      color: '#f43f5e',
    });
  }

  return {
    snappedX: finalOffsetX,
    snappedY: finalOffsetY,
    guides,
  };
}
