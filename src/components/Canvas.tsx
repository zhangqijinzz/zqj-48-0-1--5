import { forwardRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import CanvasElementRenderer from './CanvasElementRenderer';

interface CanvasProps {
  className?: string;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ className = '' }, ref) => {
  const {
    elements,
    selectedElementId,
    canvasBackground,
    canvasWidth,
    canvasHeight,
    currentTheme,
    selectElement,
    moveElement,
    resizeElement,
    updateElement,
    deleteElement,
    bringToFront,
    duplicateElement,
  } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
          return;
        }
        e.preventDefault();
        deleteElement(selectedElementId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedElementId) {
        e.preventDefault();
        duplicateElement(selectedElementId);
      }
      if (e.key === 'Escape') {
        selectElement(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, duplicateElement, selectElement]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  const getPatternStyle = () => {
    switch (currentTheme.pattern) {
      case 'dots':
        return {
          backgroundImage: `radial-gradient(circle, rgba(139, 105, 20, 0.08) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        };
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(rgba(3, 105, 161, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(3, 105, 161, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '25px 25px',
        };
      case 'lines':
        return {
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(4, 120, 87, 0.08) 24px, rgba(4, 120, 87, 0.08) 25px)`,
        };
      case 'hearts':
        return {
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(219, 39, 119, 0.05) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(219, 39, 119, 0.05) 0, transparent 40%)`,
          backgroundSize: '60px 60px',
        };
      default:
        return {};
    }
  };

  return (
    <div className={`flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-8 ${className}`}>
      <div
        ref={ref}
        id="journal-canvas"
        className="relative shadow-2xl transition-shadow"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: canvasBackground,
          minWidth: canvasWidth,
          minHeight: canvasHeight,
          ...getPatternStyle(),
        }}
        onClick={handleCanvasClick}
      >
        {elements.map((element) => (
          <CanvasElementRenderer
            key={element.id}
            element={element}
            isSelected={element.id === selectedElementId}
            onSelect={() => {
              selectElement(element.id);
              bringToFront(element.id);
            }}
            onMove={(x, y) => moveElement(element.id, x, y)}
            onResize={(w, h) => resizeElement(element.id, w, h)}
            onUpdate={(updates) => updateElement(element.id, updates)}
          />
        ))}

        {elements.length === 0 && (
          <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center text-center">
            <div className="text-6xl opacity-30">📓</div>
            <p className="mt-4 text-lg font-medium text-gray-500">开始创作你的手账吧</p>
            <p className="mt-2 text-sm text-gray-400">从左侧素材库添加元素</p>
          </div>
        )}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
