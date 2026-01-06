import { create } from "zustand"

export interface UserstoreI {
    current: UserI
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

export const useUser = create<UserstoreI>((set, get) => ({
    current: MockUser,
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
