import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '../types';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      data: [],
      headers: [],
      fileName: null,
      setData: (data, headers, fileName) => set({ data, headers, fileName }),
      updateRow: (index, column, value) => 
        set((state) => {
          const newData = [...state.data];
          newData[index] = { ...newData[index], [column]: value };
          return { data: newData };
        }),

      targetColumn: null,
      setTargetColumn: (col) => set({ targetColumn: col }),

      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),

      isPaused: false,
      setIsPaused: (isPaused) => set({ isPaused }),

      currentIndex: 0,
      setCurrentIndex: (currentIndex) => set({ currentIndex }),

      progress: 0,
      setProgress: (progress) => set({ progress }),

      reset: () => set({ 
        data: [], 
        headers: [], 
        fileName: null, 
        targetColumn: null, 
        isGenerating: false, 
        isPaused: false,
        currentIndex: 0,
        progress: 0 
      }),
    }),
    {
      name: 'auto-tutor-storage',
      partialize: (state) => ({ 
        // Only persist data structure, not process state
        data: state.data, 
        headers: state.headers,
        fileName: state.fileName,
        targetColumn: state.targetColumn
      }), 
    }
  )
);
