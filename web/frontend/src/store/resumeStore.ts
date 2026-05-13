import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ParsedResume {
  skills: string[];
  experience: { title: string; company: string; duration: string }[];
}

interface ResumeState {
  file: { name: string; size: number } | null;
  parsedData: ParsedResume | null;
  isUploading: boolean;
  isParsing: boolean;
  setFile: (file: { name: string; size: number } | null) => void;
  setParsedData: (data: ParsedResume | null) => void;
  setUploading: (val: boolean) => void;
  setParsing: (val: boolean) => void;
  clearResume: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      file: null,
      parsedData: null,
      isUploading: false,
      isParsing: false,
      setFile: (file) => set({ file }),
      setParsedData: (data) => set({ parsedData: data }),
      setUploading: (val) => set({ isUploading: val }),
      setParsing: (val) => set({ isParsing: val }),
      clearResume: () => set({ file: null, parsedData: null }),
    }),
    {
      name: 'prepmate-resume',
      partialize: (state) => ({ file: state.file, parsedData: state.parsedData }),
    }
  )
);
