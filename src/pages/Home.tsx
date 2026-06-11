import { useRef, useState } from 'react';
import Header from '@/components/Header';
import ElementPanel from '@/components/ElementPanel';
import Canvas from '@/components/Canvas';
import RightPanel from '@/components/RightPanel';
import { useCanvasStore } from '@/store/canvasStore';

export default function Home() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);

  const handleExport = async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: canvasWidth,
        height: canvasHeight,
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `手账排版-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出图片失败，请稍后重试。\n错误信息: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ElementPanel />
        <Canvas ref={canvasRef} />
        <RightPanel onExport={handleExport} />
      </div>

      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
            <p className="text-sm font-medium text-gray-700">正在生成海报图片...</p>
            <p className="text-xs text-gray-400">请稍候</p>
          </div>
        </div>
      )}
    </div>
  );
}
