export type ElementType = 'date' | 'sticky' | 'photo' | 'tape' | 'sticker';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  content?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  borderRadius?: number;
  imageUrl?: string;
  pattern?: string;
  emoji?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  decorativeColors: string[];
  fontFamily: string;
  pattern?: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  complementary: string;
  analogous1: string;
  analogous2: string;
  triadic1: string;
  triadic2: string;
  neutralLight: string;
  neutralDark: string;
}

export type ThemeId = 'retro' | 'minimal' | 'travel' | 'study' | 'cute' | 'dark';

export interface ElementTemplate {
  type: ElementType;
  name: string;
  icon: string;
  variants: Omit<CanvasElement, 'id' | 'zIndex' | 'x' | 'y'>[];
}
