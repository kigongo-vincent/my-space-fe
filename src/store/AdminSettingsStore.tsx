import { create } from "zustand"
import api from "../utils/api"

export interface AdminSettingsState {
    topUsersCount: number
    isLoading: boolean
    isSaving: boolean
    error: string | null
    fetchSettings: () => Promise<void>
    saveSettings: (settings: { topUsersCount?: number }) => Promise<boolean>
}

const DEFAULT_TOP_USERS = 5

export const useAdminSettingsStore = create<AdminSettingsState>((set, get) => ({
    topUsersCount: DEFAULT_TOP_USERS,
    isLoading: false,
    isSaving: false,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null })
        try {
            const data = await api.get<{ topUsersCount: number }>("/admin/settings", true)
            set({
                topUsersCount: data?.topUsersCount ?? DEFAULT_TOP_USERS,
                isLoading: false,
            })
        } catch (err) {
            set({
                isLoading: false,
                error: err instanceof Error ? err.message : "Failed to load settings",
                topUsersCount: DEFAULT_TOP_USERS,
            })
        }
    },

    saveSettings: async (settings) => {
        set({ isSaving: true, error: null })
        try {
            const data = await api.put<{ topUsersCount: number }>("/admin/settings", settings)
            set({
                topUsersCount: data?.topUsersCount ?? get().topUsersCount,
                isSaving: false,
            })
            return true
        } catch (err) {
            set({
                isSaving: false,
                error: err instanceof Error ? err.message : "Failed to save settings",
            })
            return false
        }
    },
}))
