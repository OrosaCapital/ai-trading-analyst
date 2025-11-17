import { ChartAnnotation, AnnotationType } from '@/types/annotations';
import { SeriesMarker } from 'lightweight-charts';

export class AnnotationManager {
  private annotations: ChartAnnotation[] = [];

  addAnnotation(annotation: ChartAnnotation) {
    this.annotations.push(annotation);
  }

  addAnnotations(annotations: ChartAnnotation[]) {
    this.annotations.push(...annotations);
  }

  getAnnotations(type?: AnnotationType): ChartAnnotation[] {
    if (type) {
      return this.annotations.filter(a => a.type === type);
    }
    return this.annotations;
  }

  clearAnnotations(type?: AnnotationType) {
    if (type) {
      this.annotations = this.annotations.filter(a => a.type !== type);
    } else {
      this.annotations = [];
    }
  }

  convertToMarkers(annotations: ChartAnnotation[]): SeriesMarker<any>[] {
    return annotations.map(annotation => {
      const timestamp = new Date(annotation.date).getTime() / 1000;
      
      return {
        time: timestamp as any,
        position: annotation.yOffset && annotation.yOffset < 0 ? 'belowBar' : 'aboveBar',
        color: annotation.color || this.getColorByType(annotation.type),
        shape: annotation.shape || this.getShapeByType(annotation.type),
        text: annotation.title,
        size: 1,
      };
    });
  }

  private getColorByType(type: AnnotationType): string {
    const colors = {
      event: '#2196F3',
      signal: '#4CAF50',
      news: '#FF9800',
      milestone: '#9C27B0',
    };
    return colors[type] || '#2196F3';
  }

  private getShapeByType(type: AnnotationType): 'circle' | 'square' | 'arrowUp' | 'arrowDown' {
    const shapes = {
      event: 'circle' as const,
      signal: 'arrowUp' as const,
      news: 'square' as const,
      milestone: 'circle' as const,
    };
    return shapes[type] || 'circle';
  }

  filterByDateRange(startDate: Date, endDate: Date): ChartAnnotation[] {
    return this.annotations.filter(annotation => {
      const date = new Date(annotation.date);
      return date >= startDate && date <= endDate;
    });
  }

  calculateOptimalOffset(
    annotation: ChartAnnotation,
    existingAnnotations: ChartAnnotation[],
    chartWidth: number
  ): { x: number; y: number } {
    // Simple collision avoidance - in a real implementation this would be more sophisticated
    const baseOffset = { x: annotation.xOffset || 0, y: annotation.yOffset || -60 };
    
    // Check for nearby annotations
    const nearby = existingAnnotations.filter(existing => {
      const timeDiff = Math.abs(
        new Date(annotation.date).getTime() - new Date(existing.date).getTime()
      );
      return timeDiff < 7 * 24 * 60 * 60 * 1000; // Within 7 days
    });

    // Alternate positioning for overlapping annotations
    if (nearby.length > 0) {
      baseOffset.y = baseOffset.y + (nearby.length * 40);
      baseOffset.x = baseOffset.x + ((nearby.length % 2) * 60 - 30);
    }

    return baseOffset;
  }
}

export const annotationManager = new AnnotationManager();
