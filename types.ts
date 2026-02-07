export interface StudentRow {
  [key: string]: any;
}

export interface AppState {
  data: StudentRow[];
  headers: string[];
  fileName: string | null;
  setData: (data: StudentRow[], headers: string[], fileName: string) => void;
  updateRow: (index: number, column: string, value: string) => void;
  
  targetColumn: string | null;
  setTargetColumn: (col: string | null) => void;
  
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
  
  currentIndex: number;
  setCurrentIndex: (index: number) => void;

  progress: number;
  setProgress: (progress: number) => void;
  
  reset: () => void;
}
