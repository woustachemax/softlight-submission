import type { FigmaNode } from "../types/types";

export class LayoutGenerator {
  getLayoutStyles(node: FigmaNode, isChild: boolean = false): Record<string, string> {
    const styles: Record<string, string> = {};

    if (node.layoutMode) {
      styles.display = 'flex';
      styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

      if (node.primaryAxisAlignItems) {
        styles.justifyContent = this.mapAlignment(node.primaryAxisAlignItems);
      }

      if (node.counterAxisAlignItems) {
        styles.alignItems = this.mapAlignment(node.counterAxisAlignItems);
      }

      if (node.itemSpacing) {
        styles.gap = `${node.itemSpacing}px`;
      }

      if (node.paddingLeft) styles.paddingLeft = `${node.paddingLeft}px`;
      if (node.paddingRight) styles.paddingRight = `${node.paddingRight}px`;
      if (node.paddingTop) styles.paddingTop = `${node.paddingTop}px`;
      if (node.paddingBottom) styles.paddingBottom = `${node.paddingBottom}px`;
    }

    if (isChild && node.layoutGrow) {
      styles.flexGrow = node.layoutGrow.toString();
    }

    if (isChild && node.layoutAlign === 'STRETCH') {
      styles.alignSelf = 'stretch';
    }

    if (node.absoluteBoundingBox) {
      const box = node.absoluteBoundingBox;
      
      if (node.primaryAxisSizingMode === 'FIXED') {
        if (node.layoutMode === 'HORIZONTAL') {
          styles.width = `${box.width}px`;
        } else if (node.layoutMode === 'VERTICAL') {
          styles.height = `${box.height}px`;
        } else {
          styles.width = `${box.width}px`;
          styles.height = `${box.height}px`;
        }
      } else if (!node.layoutMode) {
        styles.width = `${box.width}px`;
        styles.height = `${box.height}px`;
      }

      if (node.counterAxisSizingMode === 'FIXED') {
        if (node.layoutMode === 'HORIZONTAL') {
          styles.height = `${box.height}px`;
        } else if (node.layoutMode === 'VERTICAL') {
          styles.width = `${box.width}px`;
        }
      }

      if (!isChild && !node.layoutMode) {
        styles.width = `${box.width}px`;
        styles.height = `${box.height}px`;
      }
    }

    if (node.clipsContent) {
      styles.overflow = 'hidden';
    }

    if (node.opacity !== undefined && node.opacity < 1) {
      styles.opacity = node.opacity.toString();
    }

    return styles;
  }

  private mapAlignment(alignment: string): string {
    const map: Record<string, string> = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'SPACE_BETWEEN': 'space-between',
    };
    return map[alignment] || 'flex-start';
  }
}