import { create } from "zustand"

export interface UsageI {
    total: number
    unit: "GB" | "MB" | "TB" | "PB"
    used: number
}

export interface UserstoreI {
    current: UserI
    usage: UsageI
    users: UserI[]
    setUsage: (usage: UsageI) => void
    setUser: (user: UserI) => void
    getInitials: (string: string) => string
    getAllUsers: () => UserI[]
    updateUserStorage: (userId: number, storage: UsageI) => void
    suspendUser: (userId: number) => void
    deleteUser: (userId: number) => void
}

export interface UserI {
    id: number
    username: string
    email?: string
    photo: string
    role?: "admin" | "user"
    storage?: UsageI
    suspended?: boolean
}

export const MockUsage: UsageI = {
    total: 15,
    unit: "GB",
    used: 3
}

export const MockUser: UserI = {
    id: 1,
    username: "kigongo vincent",
    email: "kigongo@example.com",
    photo: "https://images.pexels.com/photos/2379886/pexels-photo-2379886.jpeg",
    role: "admin",
    storage: MockUsage
}

export const MockUsers: UserI[] = [
    MockUser,
    {
        id: 2,
        username: "john doe",
        email: "john.doe@example.com",
        photo: "https://images.pexels.com/photos/2379886/pexels-photo-2379886.jpeg",
        role: "user",
        storage: { total: 10, unit: "GB", used: 2 },
        suspended: false
    },
    {
        id: 3,
        username: "jane smith",
        email: "jane.smith@example.com",
        photo: "https://images.pexels.com/photos/2379886/pexels-photo-2379886.jpeg",
        role: "user",
        storage: { total: 20, unit: "GB", used: 5 },
        suspended: false
    },
    {
        id: 4,
        username: "bob wilson",
        email: "bob.wilson@example.com",
        photo: "https://images.pexels.com/photos/2379886/pexels-photo-2379886.jpeg",
        role: "user",
        storage: { total: 15, unit: "GB", used: 8 },
        suspended: true
    }
]

export const useUser = create<UserstoreI>((set, get) => ({
    current: MockUser,
    usage: MockUsage,
    users: MockUsers,
    setUsage: (u: UsageI) => {
        set({ ...get(), usage: u })
    },
    setUser: (u: UserI) => {
        set({ ...get(), current: u })
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
    updateUserStorage: (userId: number, storage: UsageI) => {
        const users = get().users.map(user => 
            user.id === userId ? { ...user, storage } : user
        )
        set({ ...get(), users })
        
        // Update current user if it's them
        const current = get().current
        if (current.id === userId) {
            set({ ...get(), current: { ...current, storage }, usage: storage })
        }
    },
    suspendUser: (userId: number) => {
        const users = get().users.map(user => 
            user.id === userId ? { ...user, suspended: !user.suspended } : user
        )
        set({ ...get(), users })
        
        // Update current user if it's them
        const current = get().current
        if (current.id === userId) {
            set({ ...get(), current: { ...current, suspended: !current.suspended } })
        }
    },
    deleteUser: (userId: number) => {
        const users = get().users.filter(user => user.id !== userId)
        set({ ...get(), users })
        
        // If deleted user is current user, reset to first user or empty
        const current = get().current
        if (current.id === userId) {
            const newCurrent = users.length > 0 ? users[0] : MockUser
            set({ ...get(), current: newCurrent })
        }
    }
}))
