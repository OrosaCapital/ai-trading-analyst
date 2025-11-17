export type AnnotationType = 'event' | 'signal' | 'news' | 'milestone';

export interface ChartAnnotation {
  id: string;
  date: string; // ISO date string
  price?: number;
  title: string;
  description: string;
  type: AnnotationType;
  xOffset?: number;
  yOffset?: number;
  color?: string;
  shape?: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
}

export interface AnnotationConfig {
  showEvents: boolean;
  showSignals: boolean;
  showNews: boolean;
  showMilestones: boolean;
  responsiveLabels: boolean;
}

export interface SignalAnnotation extends ChartAnnotation {
  type: 'signal';
  signalType: 'BUY' | 'SELL' | 'NO_TRADE';
  confidence: number;
  reasons: string[];
}
