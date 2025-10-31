import type { FigmaNode } from '../types/types';
import { StyleGenerator } from './style-generator';
import { LayoutGenerator } from './layout-generator';

export class HtmlGenerator {
  private styleGen = new StyleGenerator();
  private layoutGen = new LayoutGenerator();
  private classCounter = 0;
  private cssRules: string[] = [];
  private fonts = new Set<string>();

  generateHTML(node: FigmaNode): string {
    this.cssRules = [];
    this.classCounter = 0;
    this.fonts.clear();
    
    const html = this.generateNode(node, false, true, null);
    const css = this.generateCSS();
    
    return this.wrapInDocument(html, css);
  }

  private generateNode(node: FigmaNode, parentHasLayout: boolean = false, isRoot: boolean = false, parentBox: { x: number; y: number } | null = null): string {
    if (node.type === 'TEXT') {
      return this.generateText(node, parentHasLayout, parentBox);
    }

    const className = this.generateClassName(node);
    const hasLayout = !!node.layoutMode;
    const needsAbsolutePosition = !parentHasLayout && !isRoot && !!parentBox && !!node.absoluteBoundingBox;
    
    let html = `<div class="${className}">`;
    
    if (node.children) {
      const childParentBox = node.absoluteBoundingBox ? { x: node.absoluteBoundingBox.x, y: node.absoluteBoundingBox.y } : null;
      for (const child of node.children) {
        html += this.generateNode(child, hasLayout, false, childParentBox);
      }
    }
    
    html += '</div>';
    
    this.generateStyles(node, className, parentHasLayout, isRoot, needsAbsolutePosition, parentBox);
    
    return html;
  }

  private generateText(node: FigmaNode, parentHasLayout: boolean, parentBox: { x: number; y: number } | null): string {
    const className = this.generateClassName(node);
    const text = node.characters || '';
    const needsAbsolutePosition = !parentHasLayout && !!parentBox && !!node.absoluteBoundingBox;
    this.generateTextStyles(node, className, parentHasLayout, needsAbsolutePosition, parentBox);
    
    if (node.style?.fontFamily) {
      this.fonts.add(node.style.fontFamily);
    }
    
    return `<div class="${className}">${this.escapeHtml(text)}</div>`;
  }

  private generateTextStyles(node: FigmaNode, className: string, isChild: boolean, needsAbsolutePosition: boolean, parentBox: { x: number; y: number } | null): void {
    const styles: Record<string, string> = {};

    if (needsAbsolutePosition && parentBox && node.absoluteBoundingBox) {
      styles.position = 'absolute';
      styles.left = `${node.absoluteBoundingBox.x - parentBox.x}px`;
      styles.top = `${node.absoluteBoundingBox.y - parentBox.y}px`;
      styles.width = `${node.absoluteBoundingBox.width}px`;
    }

    const textStyles = this.styleGen.getTextStyles(node);
    Object.assign(styles, textStyles);

    if (node.fills) {
      const fill = node.fills.find(f => f.visible !== false && f.type === 'SOLID');
      if (fill?.color) {
        styles.color = this.styleGen.rgbaToString(fill.color, fill.opacity ?? 1);
      }
    }

    if (node.opacity !== undefined && node.opacity < 1) {
      styles.opacity = node.opacity.toString();
    }

    if (isChild && node.layoutGrow) {
      styles.flexGrow = node.layoutGrow.toString();
    }

    if (isChild && node.layoutAlign === 'STRETCH') {
      styles.alignSelf = 'stretch';
    }

    this.addCSSRule(className, styles);
  }

  private generateStyles(node: FigmaNode, className: string, isChild: boolean, isRoot: boolean, needsAbsolutePosition: boolean, parentBox: { x: number; y: number } | null): void {
    const styles: Record<string, string> = {};

    if (needsAbsolutePosition && parentBox && node.absoluteBoundingBox) {
      styles.position = 'absolute';
      styles.left = `${node.absoluteBoundingBox.x - parentBox.x}px`;
      styles.top = `${node.absoluteBoundingBox.y - parentBox.y}px`;
    } else if (!node.layoutMode && !isRoot && !isChild) {
      styles.position = 'relative';
    }

    const layoutStyles = this.layoutGen.getLayoutStyles(node, isChild);
    Object.assign(styles, layoutStyles);

    if (isRoot) {
      delete styles.position;
      styles.margin = '0 auto';
      styles.position = 'relative';
    }

    const background = this.styleGen.getBackground(node);
    if (background !== 'transparent') {
      styles.background = background;
    }

    const { border, boxSizing } = this.styleGen.getBorder(node);
    if (border !== 'none') {
      styles.border = border;
      styles.boxSizing = boxSizing;
    }

    const borderRadius = this.styleGen.getBorderRadius(node);
    if (borderRadius !== '0') {
      styles.borderRadius = borderRadius;
    }

    if (node.effects) {
      const boxShadow = this.styleGen.getBoxShadowCSS(node.effects);
      if (boxShadow !== 'none') {
        styles.boxShadow = boxShadow;
      }
    }

    this.addCSSRule(className, styles);
  }

  private generateClassName(node: FigmaNode): string {
    const safeName = node.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    return `figma-${safeName}-${this.classCounter++}`;
  }

  private addCSSRule(className: string, styles: Record<string, string>): void {
    const styleString = Object.entries(styles)
      .map(([key, value]) => `  ${this.camelToKebab(key)}: ${value};`)
      .join('\n');
    
    this.cssRules.push(`.${className} {\n${styleString}\n}`);
  }

  private generateCSS(): string {
    const fontImports = Array.from(this.fonts)
      .map(font => `@import url('https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap');`)
      .join('\n');

    return `${fontImports}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #2b2d31;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

${this.cssRules.join('\n\n')}`;
  }

  private wrapInDocument(html: string, css: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Design</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
  }

  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}