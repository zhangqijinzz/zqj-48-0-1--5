import { create } from 'zustand';
import type { CanvasElement, Theme, ColorPalette, ThemeId } from '@/types';
import { themes } from '@/data/themes';
import { generateColorPalette } from '@/lib/colorUtils';

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  currentTheme: Theme;
  currentThemeId: ThemeId;
  colorPalette: ColorPalette;
  canvasBackground: string;
  canvasWidth: number;
  canvasHeight: number;
  nextZIndex: number;

  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  duplicateElement: (id: string) => void;
  clearCanvas: () => void;

  setTheme: (themeId: ThemeId) => void;
  setPrimaryColor: (color: string) => void;
  setCanvasBackground: (color: string) => void;
  setCanvasSize: (width: number, height: number) => void;
}

let elementIdCounter = 0;
const generateId = () => `elem_${Date.now()}_${elementIdCounter++}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementId: null,
  currentTheme: themes.retro,
  currentThemeId: 'retro',
  colorPalette: generateColorPalette(themes.retro.primaryColor),
  canvasBackground: themes.retro.backgroundColor,
  canvasWidth: 800,
  canvasHeight: 1000,
  nextZIndex: 1,

  addElement: (elementData) => {
    const state = get();
    const newElement: CanvasElement = {
      ...elementData,
      id: generateId(),
      zIndex: state.nextZIndex,
    };
    set({
      elements: [...state.elements, newElement],
      selectedElementId: newElement.id,
      nextZIndex: state.nextZIndex + 1,
    });
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  selectElement: (id) => {
    set({ selectedElementId: id });
  },

  moveElement: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }));
  },

  resizeElement: (id, width, height) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, width, height } : el
      ),
    }));
  },

  bringToFront: (id) => {
    const state = get();
    set({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, zIndex: state.nextZIndex } : el
      ),
      nextZIndex: state.nextZIndex + 1,
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const minZ = Math.min(...state.elements.map((el) => el.zIndex));
      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: minZ - 1 } : el
        ),
      };
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const element = state.elements.find((el) => el.id === id);
    if (element) {
      const newElement: CanvasElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: state.nextZIndex,
      };
      set({
        elements: [...state.elements, newElement],
        selectedElementId: newElement.id,
        nextZIndex: state.nextZIndex + 1,
      });
    }
  },

  clearCanvas: () => {
    set({ elements: [], selectedElementId: null, nextZIndex: 1 });
  },

  setTheme: (themeId) => {
    const theme = themes[themeId];
    set({
      currentTheme: theme,
      currentThemeId: themeId,
      colorPalette: generateColorPalette(theme.primaryColor),
      canvasBackground: theme.backgroundColor,
    });
  },

  setPrimaryColor: (color) => {
    set({
      colorPalette: generateColorPalette(color),
    });
  },

  setCanvasBackground: (color) => {
    set({ canvasBackground: color });
  },

  setCanvasSize: (width, height) => {
    set({ canvasWidth: width, canvasHeight: height });
  },
}));
