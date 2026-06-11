import { useState } from 'react';
import { Calendar, StickyNote, Image, Ruler, Smile, ChevronDown, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { elementTemplates } from '@/data/elementTemplates';
import type { ElementTemplate, ElementType } from '@/types';

const iconMap: Record<ElementType, React.ComponentType<{ className?: string }>> = {
  date: Calendar,
  sticky: StickyNote,
  photo: Image,
  tape: Ruler,
  sticker: Smile,
};

function VariantPreview({ template, variantIndex }: { template: ElementTemplate; variantIndex: number }) {
  const variant = template.variants[variantIndex];
  const addElement = useCanvasStore((s) => s.addElement);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);

  const handleClick = () => {
    const centerX = (canvasWidth - variant.width) / 2 + (Math.random() - 0.5) * 100;
    const centerY = (canvasHeight - variant.height) / 2 + (Math.random() - 0.5) * 100;
    addElement({
      ...variant,
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
    });
  };

  const isSticker = template.type === 'sticker';
  const isTape = template.type === 'tape';

  return (
    <button
      onClick={handleClick}
      className="group relative flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-2 transition-all hover:border-gray-400 hover:shadow-md"
      style={{
        minHeight: isTape ? 50 : isSticker ? 70 : 90,
        background: isSticker ? 'linear-gradient(135deg, #fef9c3 0%, #fce7f3 100%)' : undefined,
      }}
    >
      {isSticker ? (
        <span className="text-3xl">{variant.emoji}</span>
      ) : isTape ? (
        <div
          className="rounded-sm"
          style={{
            width: '80%',
            height: variant.height * 0.6,
            backgroundColor: variant.backgroundColor,
            opacity: variant.opacity ?? 1,
            transform: `rotate(${variant.rotation * 0.3}deg)`,
          }}
        />
      ) : (
        <div
          className="flex w-full flex-col items-center justify-center overflow-hidden rounded text-center"
          style={{
            width: Math.min(variant.width * 0.6, 100),
            height: Math.min(variant.height * 0.6, 80),
            backgroundColor: variant.backgroundColor,
            color: variant.textColor,
            border: variant.borderWidth ? `${variant.borderWidth * 0.5}px solid ${variant.borderColor}` : undefined,
            borderRadius: variant.borderRadius ? Math.min(variant.borderRadius * 0.5, 20) : 0,
            transform: `rotate(${variant.rotation * 0.4}deg)`,
            opacity: variant.opacity ?? 1,
            fontSize: Math.min((variant.fontSize ?? 12) * 0.7, 10),
            padding: 4,
            lineHeight: 1.2,
          }}
        >
          <span className="line-clamp-3 text-[9px] leading-tight">
            {template.type === 'date' && '日期'}
            {template.type === 'sticky' && '便签内容'}
            {template.type === 'photo' && '🖼️'}
          </span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
        点击添加
      </div>
    </button>
  );
}

export default function ElementPanel() {
  const [expandedSections, setExpandedSections] = useState<Record<ElementType, boolean>>({
    date: true,
    sticky: true,
    photo: true,
    tape: true,
    sticker: true,
  });

  const toggleSection = (type: ElementType) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="flex h-full w-72 flex-col overflow-hidden border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4">
        <h2 className="text-lg font-bold text-gray-800">🎨 素材库</h2>
        <p className="mt-1 text-xs text-gray-500">点击添加元素到画布</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {elementTemplates.map((template) => {
          const Icon = iconMap[template.type];
          const isExpanded = expandedSections[template.type];
          return (
            <div key={template.type} className="mb-3 rounded-lg border border-gray-100 bg-gray-50/50">
              <button
                onClick={() => toggleSection(template.type)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-100/50"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{template.name}</span>
                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {template.variants.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="grid grid-cols-2 gap-2 p-2 pt-0">
                  {template.variants.map((_, idx) => (
                    <VariantPreview key={idx} template={template} variantIndex={idx} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
