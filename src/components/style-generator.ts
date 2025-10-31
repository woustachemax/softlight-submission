import type { FigmaNode, Color, Fill, Effect, BoundingBox } from '../types/types';

export class StyleGenerator {
  rgbaToString(color: Color, opacity: number = 1): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = (color.a ?? 1) * opacity;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }

  getGradientCSS(fill: Fill, _box: BoundingBox): string {
    if (!fill.gradientStops || !fill.gradientHandlePositions) return '';
    
    const stops = fill.gradientStops
      .map(stop => {
        const color = this.rgbaToString(stop.color);
        return `${color} ${(stop.position * 100).toFixed(1)}%`;
      })
      .join(', ');

    if (fill.type === 'GRADIENT_LINEAR') {
      const start = fill.gradientHandlePositions[0];
      const end = fill.gradientHandlePositions[1];
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
      return `linear-gradient(${angle.toFixed(1)}deg, ${stops})`;
    }
    
    if (fill.type === 'GRADIENT_RADIAL') {
      return `radial-gradient(circle, ${stops})`;
    }
    
    return '';
  }

  getBoxShadowCSS(effects: Effect[]): string {
    const shadows = effects
      .filter(e => e.visible !== false && (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'))
      .map(effect => {
        const x = effect.offset?.x || 0;
        const y = effect.offset?.y || 0;
        const blur = effect.radius || 0;
        const spread = effect.spread || 0;
        const color = effect.color ? this.rgbaToString(effect.color) : 'rgba(0,0,0,0.25)';
        const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
        return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
      })
      .join(', ');
    
    return shadows || 'none';
  }

  getBorderRadius(node: FigmaNode): string {
    if (node.rectangleCornerRadii) {
      const [tl, tr, br, bl] = node.rectangleCornerRadii;
      if (tl === tr && tr === br && br === bl) {
        return `${tl}px`;
      }
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    return node.cornerRadius ? `${node.cornerRadius}px` : '0';
  }

  getBackground(node: FigmaNode): string {
    const visibleFills = node.fills?.filter(f => f.visible !== false) || [];
    if (visibleFills.length === 0) return 'transparent';

    const fill = visibleFills[0];
    
    if (fill.type === 'SOLID' && fill.color) {
      return this.rgbaToString(fill.color, fill.opacity ?? 1);
    }
    
    if ((fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') && node.absoluteBoundingBox) {
      return this.getGradientCSS(fill, node.absoluteBoundingBox);
    }
    
    return 'transparent';
  }

  getBorder(node: FigmaNode): { border: string; boxSizing: string } {
    const visibleStrokes = node.strokes?.filter(s => s.visible !== false && s.type === 'SOLID') || [];
    if (visibleStrokes.length === 0 || !node.strokeWeight) {
      return { border: 'none', boxSizing: 'border-box' };
    }

    const stroke = visibleStrokes[0];
    const color = stroke.color ? this.rgbaToString(stroke.color, stroke.opacity ?? 1) : '#000';
    const weight = node.strokeWeight;
    
    return {
      border: `${weight}px solid ${color}`,
      boxSizing: 'border-box'
    };
  }

  getTextStyles(node: FigmaNode): Record<string, string> {
    if (!node.style) return {};

    const styles: Record<string, string> = {};

    if (node.style.fontFamily) {
      styles.fontFamily = `"${node.style.fontFamily}", sans-serif`;
    }

    if (node.style.fontWeight) {
      styles.fontWeight = node.style.fontWeight.toString();
    }

    if (node.style.fontSize) {
      styles.fontSize = `${node.style.fontSize}px`;
    }

    if (node.style.letterSpacing) {
      styles.letterSpacing = `${node.style.letterSpacing}px`;
    }

    if (node.style.lineHeightPx) {
      styles.lineHeight = `${node.style.lineHeightPx}px`;
    }

    if (node.style.textAlignHorizontal) {
      styles.textAlign = node.style.textAlignHorizontal.toLowerCase();
    }

    return styles;
  }
}