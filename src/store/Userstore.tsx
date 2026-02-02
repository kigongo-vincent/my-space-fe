import { create } from "zustand"
import api from "../utils/api"
import { useTheme } from "./Themestore"

export interface UsageI {
    total: number
    unit: "GB" | "MB" | "TB" | "PB"
    used: number
}

export interface UserstoreI {
    current: UserI | null
    usage: UsageI | null
    users: UserI[]
    isLoading: boolean
    isAuthenticated: boolean
    setUsage: (usage: UsageI) => void
    setUser: (user: UserI) => void
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    fetchCurrentUser: () => Promise<void>
    fetchAllUsers: () => Promise<void>
    getInitials: (string: string) => string
    getAllUsers: () => UserI[]
    updateUserStorage: (userId: number, storage: UsageI) => Promise<void>
    suspendUser: (userId: number) => Promise<void>
    deleteUser: (userId: number) => Promise<void>
}

export interface UserI {
    id: number
    username: string
    email?: string
    photo: string
    role?: "admin" | "user"
    storage?: UsageI
    suspended?: boolean
    provider?: string // "google", "apple", or "" for email/password
}

export const useUser = create<UserstoreI>((set, get) => ({
    current: null,
    usage: null,
    users: [],
    isLoading: false,
    isAuthenticated: !!localStorage.getItem('token'),
    setUsage: (u: UsageI) => {
        set({ ...get(), usage: u })
    },
    setUser: (u: UserI) => {
        set({ ...get(), current: u, usage: u.storage || null })
    },
    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true })
            const response = await api.post<{ token: string; user: any }>('/users/login', { email, password })
            
            // Map backend response to frontend UserI
            const user: UserI = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
                photo: response.user.photo || '',
                role: response.user.role as "admin" | "user",
                suspended: response.user.suspended,
                storage: response.user.storage ? {
                    total: response.user.storage.total,
                    used: response.user.storage.used,
                    unit: response.user.storage.unit as "GB" | "MB" | "TB" | "PB"
                } : undefined,
                provider: response.user.provider || undefined,
            }
            
            localStorage.setItem('token', response.token)
            localStorage.setItem('user', JSON.stringify(user))
            set({ 
                current: user, 
                usage: user.storage || null,
                isAuthenticated: true,
                isLoading: false 
            })
            return { success: true }
        } catch (error: any) {
            set({ isLoading: false })
            return { success: false, error: error.message || 'Login failed' }
        }
    },
    register: async (username: string, email: string, password: string) => {
        try {
            set({ isLoading: true })
            await api.post('/users/register', { username, email, password })
            
            // After registration, login the user
            const loginResponse = await api.post<{ token: string; user: any }>('/users/login', { email, password })
            
            // Map backend response to frontend UserI
            const user: UserI = {
                id: loginResponse.user.id,
                username: loginResponse.user.username,
                email: loginResponse.user.email,
                photo: loginResponse.user.photo || '',
                role: loginResponse.user.role as "admin" | "user",
                suspended: loginResponse.user.suspended,
                storage: loginResponse.user.storage ? {
                    total: loginResponse.user.storage.total,
                    used: loginResponse.user.storage.used,
                    unit: loginResponse.user.storage.unit as "GB" | "MB" | "TB" | "PB"
                } : undefined,
                provider: loginResponse.user.provider || undefined,
            }
            
            localStorage.setItem('token', loginResponse.token)
            localStorage.setItem('user', JSON.stringify(user))
            set({ 
                current: user, 
                usage: user.storage || null,
                isAuthenticated: true,
                isLoading: false 
            })
            return { success: true }
        } catch (error: any) {
            set({ isLoading: false })
            // Extract error message - handle both string and object formats
            let errorMessage = 'Registration failed'
            if (error?.message) {
                errorMessage = error.message
                // If error message is a JSON string, parse it
                if (typeof errorMessage === 'string') {
                    // Try to parse if it looks like JSON
                    if (errorMessage.trim().startsWith('{') || errorMessage.trim().startsWith('"')) {
                        try {
                            const parsed = JSON.parse(errorMessage)
                            errorMessage = parsed.error || parsed.message || errorMessage
                        } catch {
                            // If parsing fails, try to extract error from string using regex
                            const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                            if (match) {
                                errorMessage = match[1]
                            }
                        }
                    }
                }
            } else if (typeof error === 'string') {
                errorMessage = error
                // Try to parse if it looks like JSON
                if (errorMessage.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(errorMessage)
                        errorMessage = parsed.error || parsed.message || errorMessage
                    } catch {
                        // If parsing fails, try to extract error from string
                        const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                        if (match) {
                            errorMessage = match[1]
                        }
                    }
                }
            }
            return { success: false, error: errorMessage }
        }
    },
    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ current: null, usage: null, isAuthenticated: false, users: [] })
    },
    fetchCurrentUser: async () => {
        try {
            set({ isLoading: true })
            const response = await api.get<any>('/users/me')
            
            // Map backend response to frontend UserI
            const user: UserI = {
                id: response.id,
                username: response.username,
                email: response.email,
                photo: response.photo || '',
                role: response.role as "admin" | "user",
                suspended: response.suspended,
                storage: response.storage ? {
                    total: response.storage.total,
                    used: response.storage.used,
                    unit: response.storage.unit as "GB" | "MB" | "TB" | "PB"
                } : undefined,
                provider: response.provider || undefined,
            }
            
            localStorage.setItem('user', JSON.stringify(user))
            set({ 
                current: user, 
                usage: user.storage || null,
                isAuthenticated: true,
                isLoading: false 
            })

            // Fetch and apply user settings from backend
            try {
                const settings = await api.get<Record<string, unknown>>('/users/me/settings', true)
                if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
                    useTheme.getState().applySettingsFromBackend(settings)
                }
            } catch {
                // Ignore - user may have no settings yet
            }
        } catch (error) {
            set({ isLoading: false, isAuthenticated: false, current: null })
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
    },
    fetchAllUsers: async () => {
        try {
            const response = await api.get<any[]>('/users/')
            const users: UserI[] = response.map((u: any) => ({
                id: u.id,
                username: u.username,
                email: u.email,
                photo: u.photo || '',
                role: u.role as "admin" | "user",
                suspended: u.suspended,
                storage: u.storage ? {
                    total: u.storage.total,
                    used: u.storage.used,
                    unit: u.storage.unit as "GB" | "MB" | "TB" | "PB"
                } : undefined
            }))
            set({ users })
        } catch {
            set({ users: [] })
        }
    },
    getInitials: (s: string): string => {
        const sArray = s?.split(" ")
        let output = ""
        sArray?.forEach((s, i) => {
            if (i < 2 && s) {
                output += s.charAt(0)
            }
        })
        return output
    },
    getAllUsers: () => {
        return get().users
    },
    updateUserStorage: async (userId: number, storage: UsageI) => {
        try {
            await api.put(`/users/${userId}/storage`, storage)
            const users = get().users.map(user => 
                user.id === userId ? { ...user, storage } : user
            )
            set({ ...get(), users })
            
            // Update current user if it's them
            const current = get().current
            if (current && current.id === userId) {
                set({ ...get(), current: { ...current, storage }, usage: storage })
            }
        } catch (error) {
            throw error
        }
    },
    suspendUser: async (userId: number) => {
        try {
            await api.patch(`/users/${userId}/suspend`)
            const users = get().users.map(user => 
                user.id === userId ? { ...user, suspended: !user.suspended } : user
            )
            set({ ...get(), users })
            
            // Update current user if it's them
            const current = get().current
            if (current && current.id === userId) {
                set({ ...get(), current: { ...current, suspended: !current.suspended } })
            }
        } catch (error) {
            throw error
        }
    },
    deleteUser: async (userId: number) => {
        try {
            await api.delete(`/users/${userId}`)
            const users = get().users.filter(user => user.id !== userId)
            set({ ...get(), users })
            
            // If deleted user is current user, logout
            const current = get().current
            if (current && current.id === userId) {
                get().logout()
            }
        } catch (error) {
            throw error
        }
    }
}))
