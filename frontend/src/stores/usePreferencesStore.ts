import { create } from "zustand";

interface PreferencesState {
  skipDeleteConfirm: boolean;
  setSkipDeleteConfirm: (skip: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  skipDeleteConfirm: false,
  setSkipDeleteConfirm: (skip) => set({ skipDeleteConfirm: skip }),
}));
