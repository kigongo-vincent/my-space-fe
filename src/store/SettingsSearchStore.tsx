import { create } from "zustand"

interface SettingsSearchState {
    searchQuery: string
    setSearchQuery: (query: string) => void
    clearSearch: () => void
}

export const useSettingsSearchStore = create<SettingsSearchState>((set) => ({
    searchQuery: "",
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    clearSearch: () => set({ searchQuery: "" })
}))
