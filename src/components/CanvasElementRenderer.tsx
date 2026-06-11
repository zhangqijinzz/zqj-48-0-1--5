import { useRef, useEffect, useState } from 'react';
import type { CanvasElement } from '@/types';
import { hexToRgba } from '@/lib/colorUtils';

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
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elemX: 0, elemY: 0 });
  const [resizeStart, setResizeStart] = useState({ startX: 0, startY: 0, startW: 0, startH: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onMove(dragStart.elemX + dx, dragStart.elemY + dy);
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.startX;
        const dy = e.clientY - resizeStart.startY;
        const newWidth = Math.max(30, resizeStart.startW + dx);
        const newHeight = Math.max(30, resizeStart.startH + dy);
        onResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, onMove, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    if (!isEditing) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elemX: element.x,
        elemY: element.y,
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startW: element.width,
      startH: element.height,
    });
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
      ref={elementRef}
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
