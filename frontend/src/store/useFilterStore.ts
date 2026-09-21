import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FilterState {
  selectedTags: string[];
  sort: 'recommended' | 'new' | 'top';
  gender: string;
  language: string;
  showUnfiltered: boolean;

  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSort: (sort: 'recommended' | 'new' | 'top') => void;
  setGender: (gender: string) => void;
  setLanguage: (language: string) => void;
  setShowUnfiltered: (val: boolean) => void;
  resetFilters: (isLoggedIn?: boolean) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedTags: [],
      sort: 'new',
      gender: 'ALL',
      language: 'ALL',
      showUnfiltered: false,

      setSelectedTags: (selectedTags) => set({ selectedTags }),
      toggleTag: (tag) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag],
        })),
      setSort: (sort) => set({ sort }),
      setGender: (gender) => set({ gender }),
      setLanguage: (language) => set({ language }),
      setShowUnfiltered: (showUnfiltered) => set({ showUnfiltered }),
      resetFilters: (isLoggedIn = false) =>
        set({
          selectedTags: [],
          sort: isLoggedIn ? 'recommended' : 'new',
          gender: 'ALL',
          language: 'ALL',
          showUnfiltered: false,
        }),
    }),
    {
      name: 'suroor-dashboard-filters',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);