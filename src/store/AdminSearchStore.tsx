import { create } from "zustand"

interface AdminSearchState {
    searchQuery: string
    setSearchQuery: (query: string) => void
    clearSearch: () => void
}

export const useAdminSearchStore = create<AdminSearchState>((set) => ({
    searchQuery: "",
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    clearSearch: () => set({ searchQuery: "" })
}))
