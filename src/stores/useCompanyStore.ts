import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectedCompaniesStore {
  selectedCompanies: Set<string>;
  addCompany: (isin: string) => void;
  removeCompany: (isin: string) => void;
  toggleCompany: (isin: string) => void;
  addCompanies: (isins: string[]) => void;
  removeCompanies: (isins: string[]) => void;
  setSelectedCompanies: (isins: string[]) => void;
  clearSelectedCompanies: () => void;
  hasCompany: (isin: string) => boolean;
  getSelectedArray: () => string[];
  getSelectedCount: () => number;
}

export const useSelectedCompaniesStore = create<SelectedCompaniesStore>()(
  persist(
    (set, get) => ({
      selectedCompanies: new Set<string>(),

      addCompany: (isin) =>
        set((state) => {
          const newSet = new Set(state.selectedCompanies);
          newSet.add(isin);
          return { selectedCompanies: newSet };
        }),

      removeCompany: (isin) =>
        set((state) => {
          const newSet = new Set(state.selectedCompanies);
          newSet.delete(isin);
          return { selectedCompanies: newSet };
        }),

      toggleCompany: (isin) =>
        set((state) => {
          const newSet = new Set(state.selectedCompanies);
          if (newSet.has(isin)) {
            newSet.delete(isin);
          } else {
            newSet.add(isin);
          }
          return { selectedCompanies: newSet };
        }),

      addCompanies: (isins) =>
        set((state) => {
          const newSet = new Set(state.selectedCompanies);
          isins.forEach((isin) => newSet.add(isin));
          return { selectedCompanies: newSet };
        }),

      removeCompanies: (isins) =>
        set((state) => {
          const newSet = new Set(state.selectedCompanies);
          isins.forEach((isin) => newSet.delete(isin));
          return { selectedCompanies: newSet };
        }),

      setSelectedCompanies: (isins) =>
        set({ selectedCompanies: new Set(isins) }),

      clearSelectedCompanies: () =>
        set({ selectedCompanies: new Set() }),

      hasCompany: (isin) => get().selectedCompanies.has(isin),

      getSelectedArray: () => Array.from(get().selectedCompanies),

      getSelectedCount: () => get().selectedCompanies.size,
    }),
    {
      name: 'selected-companies-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              selectedCompanies: new Set(parsed.state.selectedCompanies || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              selectedCompanies: Array.from(value.state.selectedCompanies || []),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);