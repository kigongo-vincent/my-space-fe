import { create } from "zustand"

export interface FilterState {
    // Activity Log filters
    activityType: string // "all" | "user" | "storage" | "system" | "security"
    
    // User Management filters
    userRole: string // "all" | "admin" | "user"
    userStatus: string // "all" | "active" | "suspended"
    
    // Analytics filters
    dateRange: string // "all" | "today" | "week" | "month" | "year"
    analyticsType: string // "all" | "users" | "storage" | "activity"
    
    // Storage Overview filters
    storageRange: string // "all" | "low" | "medium" | "high"
    
    // Temporary filter state (before applying)
    tempFilters: Record<string, string>
    
    // Generic methods
    setFilter: (key: string, value: string) => void
    setTempFilter: (key: string, value: string) => void
    applyTempFilters: () => void
    resetFilters: () => void
    resetTempFilters: () => void
    getFiltersForPage: (page: string) => Record<string, any>
}

const initialState = {
    activityType: "all",
    userRole: "all",
    userStatus: "all",
    dateRange: "all",
    analyticsType: "all",
    storageRange: "all",
    tempFilters: {}
}

export const useAdminFilterStore = create<FilterState>((set, get) => ({
    ...initialState,
    
    setFilter: (key: string, value: string) => {
        set({ [key]: value } as Partial<FilterState>)
    },
    
    setTempFilter: (key: string, value: string) => {
        const state = get()
        set({ 
            tempFilters: { ...state.tempFilters, [key]: value }
        })
    },
    
    applyTempFilters: () => {
        const state = get()
        const updates: Partial<FilterState> = {}
        Object.keys(state.tempFilters).forEach(key => {
            if (key === 'activityType' || key === 'userRole' || key === 'userStatus' || 
                key === 'dateRange' || key === 'analyticsType' || key === 'storageRange') {
                updates[key as keyof FilterState] = state.tempFilters[key] as any
            }
        })
        set({ ...updates, tempFilters: {} })
    },
    
    resetFilters: () => {
        set({ ...initialState })
    },
    
    resetTempFilters: () => {
        const state = get()
        // Reset temp filters to current filter values
        const tempFilters: Record<string, string> = {}
        if (state.activityType !== "all") tempFilters.activityType = state.activityType
        if (state.userRole !== "all") tempFilters.userRole = state.userRole
        if (state.userStatus !== "all") tempFilters.userStatus = state.userStatus
        if (state.dateRange !== "all") tempFilters.dateRange = state.dateRange
        if (state.analyticsType !== "all") tempFilters.analyticsType = state.analyticsType
        if (state.storageRange !== "all") tempFilters.storageRange = state.storageRange
        
        // Reset to "all" in temp
        set({ tempFilters: {} })
    },
    
    getFiltersForPage: (page: string) => {
        const state = get()
        switch (page) {
            case "activity":
                return {
                    activityType: state.activityType
                }
            case "users":
                return {
                    userRole: state.userRole,
                    userStatus: state.userStatus
                }
            case "analytics":
                return {
                    dateRange: state.dateRange,
                    analyticsType: state.analyticsType
                }
            case "storage":
                return {
                    storageRange: state.storageRange
                }
            default:
                return {}
        }
    }
}))
