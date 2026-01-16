export interface CorrectionResult {
  original: string;
  corrected: string;
  hindi: string;
  suggestions: string[];
  grammarRules: string[];
  timestamp: number;
}

export interface LoadingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}