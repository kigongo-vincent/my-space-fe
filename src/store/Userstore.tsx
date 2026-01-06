import { create } from "zustand"

export interface UsageI {
    total: number
    unit: "GB" | "MB" | "TB" | "PB"
    used: number
}

export interface UserstoreI {
    current: UserI
    usage: UsageI
    setUsage: (usage: UsageI) => void
    setUser: (user: UserI) => void
    getInitials: (string: string) => string
}

export interface UserI {
    id: number
    username: string
    photo: string
}

export const MockUser: UserI = {
    id: 1,
    username: "kigongo vincent",
    photo: "https://images.pexels.com/photos/2379886/pexels-photo-2379886.jpeg"
}

export const MockUsage: UsageI = {
    total: 15,
    unit: "GB",
    used: 3
}

export const useUser = create<UserstoreI>((set, get) => ({
    current: MockUser,
    usage: MockUsage,
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
    }
}))
