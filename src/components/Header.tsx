import { useState } from 'react';
import { BookOpen, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Sparkles, Grid3X3 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

const sizePresets = [
  { name: 'A4竖版', width: 800, height: 1131 },
  { name: 'A4横版', width: 1131, height: 800 },
  { name: '方形', width: 800, height: 800 },
  { name: '手机壁纸', width: 1080, height: 1920 },
  { name: '海报', width: 900, height: 1200 },
  { name: '小红书', width: 1080, height: 1440 },
];

export default function Header() {
  const { canvasWidth, canvasHeight, setCanvasSize, clearCanvas, currentTheme } = useCanvasStore();
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">手账排版实验室</h1>
            <p className="text-[10px] text-gray-500">
              当前主题: <span className="font-medium" style={{ color: currentTheme.primaryColor }}>{currentTheme.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
              title="撤销"
              disabled
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
              title="重做"
              disabled
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-2 h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
              title="缩小"
              disabled
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-gray-600 tabular-nums">100%</span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
              title="放大"
              disabled
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-2 h-6 w-px bg-gray-200" />

          <button
            onClick={() => setShowSizeModal(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-800"
            title="画布尺寸"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            {canvasWidth} × {canvasHeight}
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            title="清空画布"
          >
            <Sparkles className="h-3.5 w-3.5" />
            重新开始
          </button>
        </div>
      </header>

      {showSizeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSizeModal(false)}
        >
          <div
            className="w-[420px] rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">🎨 画布尺寸设置</h3>
              <button
                onClick={() => setShowSizeModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setCanvasSize(preset.width, preset.height)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                    canvasWidth === preset.width && canvasHeight === preset.height
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Maximize2 className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">{preset.name}</span>
                  <span className="text-[10px] text-gray-400">{preset.width}×{preset.height}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <h4 className="text-xs font-semibold text-gray-600">自定义尺寸</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">宽度 (px)</label>
                  <input
                    type="number"
                    value={canvasWidth}
                    min={200}
                    max={4000}
                    onChange={(e) => setCanvasSize(Number(e.target.value) || 200, canvasHeight)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">高度 (px)</label>
                  <input
                    type="number"
                    value={canvasHeight}
                    min={200}
                    max={4000}
                    onChange={(e) => setCanvasSize(canvasWidth, Number(e.target.value) || 200)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowClearModal(false)}
        >
          <div
            className="w-[380px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Sparkles className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">重新开始</h3>
                <p className="text-xs text-gray-500">清空当前画布的所有内容</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-amber-50/80 p-4">
              <p className="text-sm leading-relaxed text-amber-900">
                ⚠️ 确定要清空画布吗？此操作将永久删除当前画布上的所有元素，包括日期、便签、照片、胶带和贴纸等，且<strong>无法撤销</strong>。
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setShowClearModal(false);
                }}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600 hover:shadow-red-500/35 active:scale-[0.98]"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
