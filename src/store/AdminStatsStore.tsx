import { create } from "zustand"
import api from "../utils/api"

export interface MonthCount {
    month: string
    count: number
}

export interface MonthValue {
    month: string
    valueGB: number
}

export interface AdminStats {
    totalUsers: number
    activeUsers: number
    suspendedUsers: number
    totalStorageGB: number
    usedStorageGB: number
    avgStorageGB: number
    usagePercent: number
    recordedAt: string
    userGrowth: MonthCount[]
    storageTrend: MonthValue[]
}

interface AdminStatsState {
    stats: AdminStats | null
    isLoading: boolean
    error: string | null
    fetchStats: () => Promise<void>
}

const emptyStats: AdminStats = {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalStorageGB: 0,
    usedStorageGB: 0,
    avgStorageGB: 0,
    usagePercent: 0,
    recordedAt: "",
    userGrowth: [],
    storageTrend: [],
}

export const useAdminStatsStore = create<AdminStatsState>((set) => ({
    stats: null,
    isLoading: false,
    error: null,

    fetchStats: async () => {
        set({ isLoading: true, error: null })
        try {
            const data = await api.get<AdminStats>("/admin/stats", true)
            set({
                stats: data || emptyStats,
                isLoading: false,
            })
        } catch (err) {
            set({
                stats: null,
                isLoading: false,
                error: err instanceof Error ? err.message : "Failed to load stats",
            })
        }
    },
}))
