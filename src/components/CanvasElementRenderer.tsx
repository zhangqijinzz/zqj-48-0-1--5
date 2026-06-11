import { useRef, useEffect, useState, useCallback } from 'react';
import type { CanvasElement } from '@/types';
import { hexToRgba } from '@/lib/colorUtils';
import { useCanvasStore } from '@/store/canvasStore';
import { computeSnapFromPosition, createInitialSnapContext, type SnapContext } from '@/lib/guides';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

export default function CanvasElementRenderer({
  element,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onUpdate,
}: CanvasElementRendererProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dragStateRef = useRef({
    active: false,
    startMouseX: 0,
    startMouseY: 0,
    startElemX: 0,
    startElemY: 0,
    snapCtx: createInitialSnapContext(),
  });

  const resizeStateRef = useRef({
    active: false,
    startMouseX: 0,
    startMouseY: 0,
    startW: 0,
    startH: 0,
  });

  const storeRef = useRef(useCanvasStore.getState());
  useEffect(() => {
    storeRef.current = useCanvasStore.getState();
  });

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const clearGuidesRef = useRef(useCanvasStore.getState().clearGuides);
  clearGuidesRef.current = useCanvasStore.getState().clearGuides;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (ds.active) {
        const rawDx = e.clientX - ds.startMouseX;
        const rawDy = e.clientY - ds.startMouseY;
        const rawX = ds.startElemX + rawDx;
        const rawY = ds.startElemY + rawDy;

        const store = storeRef.current;
        const { result, newContext } = computeSnapFromPosition(
          [element],
          store.elements,
          store.canvasWidth,
          store.canvasHeight,
          rawX,
          rawY,
          ds.snapCtx
        );

        ds.snapCtx = newContext;
        onMoveRef.current(result.snappedX, result.snappedY);
        store.setGuides(result.guides);
      }

      const rs = resizeStateRef.current;
      if (rs.active) {
        const dx = e.clientX - rs.startMouseX;
        const dy = e.clientY - rs.startMouseY;
        onResizeRef.current(
          Math.max(30, rs.startW + dx),
          Math.max(30, rs.startH + dy)
        );
      }
    };

    const handleMouseUp = () => {
      const ds = dragStateRef.current;
      if (ds.active) {
        ds.active = false;
        ds.snapCtx = createInitialSnapContext();
        setIsDragging(false);
        clearGuidesRef.current();
      }
      const rs = resizeStateRef.current;
      if (rs.active) {
        rs.active = false;
        setIsResizing(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [element]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    if (!isEditing) {
      setIsDragging(true);
      const ds = dragStateRef.current;
      ds.active = true;
      ds.startMouseX = e.clientX;
      ds.startMouseY = e.clientY;
      ds.startElemX = element.x;
      ds.startElemY = element.y;
      ds.snapCtx = createInitialSnapContext();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const rs = resizeStateRef.current;
    rs.active = true;
    rs.startMouseX = e.clientX;
    rs.startMouseY = e.clientY;
    rs.startW = element.width;
    rs.startH = element.height;
  };

  const handleDoubleClick = () => {
    if (element.type === 'date' || element.type === 'sticky') {
      setIsEditing(true);
    }
    if (element.type === 'photo') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            onUpdate({ imageUrl: e.target?.result as string });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const tapePatternStyle = element.pattern === 'stripes'
    ? {
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, ${hexToRgba('#FFFFFF', 0.3)} 8px, ${hexToRgba('#FFFFFF', 0.3)} 16px)`,
      }
    : element.pattern === 'dots'
    ? {
        backgroundImage: `radial-gradient(${hexToRgba('#FFFFFF', 0.4)} 1.5px, transparent 1.5px)`,
        backgroundSize: '8px 8px',
      }
    : {};

  return (
    <div
      ref={divRef}
      className={`absolute select-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
        opacity: element.opacity ?? 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          backgroundColor: element.backgroundColor,
          border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor}` : undefined,
          borderRadius: element.borderRadius ?? 0,
          fontFamily: element.fontFamily,
          color: element.textColor,
          ...tapePatternStyle,
        }}
      >
        {element.type === 'sticker' && element.emoji && (
          <div className="flex h-full w-full items-center justify-center text-5xl drop-shadow-lg">
            {element.emoji}
          </div>
        )}

        {(element.type === 'date' || element.type === 'sticky') && (
          <div className="h-full w-full p-3">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={element.content || ''}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleKeyDown}
                className="h-full w-full resize-none border-none bg-transparent outline-none"
                style={{
                  fontFamily: element.fontFamily,
                  color: element.textColor,
                  fontSize: element.fontSize ?? 14,
                  lineHeight: 1.5,
                }}
              />
            ) : (
              <div
                className="whitespace-pre-wrap break-words"
                style={{
                  fontSize: element.fontSize ?? 14,
                  lineHeight: 1.5,
                  height: '100%',
                  display: element.type === 'date' ? 'flex' : 'block',
                  flexDirection: element.type === 'date' ? 'column' : undefined,
                  alignItems: element.type === 'date' ? 'center' : undefined,
                  justifyContent: element.type === 'date' ? 'center' : undefined,
                  textAlign: element.type === 'date' ? 'center' : 'left',
                }}
              >
                {element.content}
              </div>
            )}
          </div>
        )}

        {element.type === 'photo' && (
          <div className="relative h-full w-full">
            {element.imageUrl ? (
              <img
                src={element.imageUrl}
                alt="uploaded"
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <span className="text-3xl">🖼️</span>
                <span className="mt-2 px-3 text-xs leading-tight">
                  {element.content || '双击上传照片'}
                </span>
              </div>
            )}
          </div>
        )}

        {element.type === 'tape' && (
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="h-full flex-1"
              style={{
                background: `linear-gradient(90deg, ${hexToRgba('#000000', 0.03)} 0%, ${hexToRgba('#FFFFFF', 0.08)} 50%, ${hexToRgba('#000000', 0.03)} 100%)`,
              }}
            />
          </div>
        )}
      </div>

      {isSelected && !isEditing && (
        <>
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-sm bg-blue-500 shadow-md"
            onMouseDown={handleResizeStart}
          />
          <div className="absolute -top-2 -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
        </>
      )}
    </div>
  );
}
