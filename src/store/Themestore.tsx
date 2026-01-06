import { create } from "zustand"

type ThemeMode = "light" | "dark"
type BackgroundMode = "background" | "foreground" | ""

export interface ThemeStoreI {
    name: ThemeMode
    current: ThemeI
    setTheme: (name: ThemeMode, theme: ThemeI) => void
    getBackgroundColor: (mode: BackgroundMode) => string
}

export interface ThemeI {
    primary: string
    background: string
    foreground: string
    error: string
    success: string
    dark: string
}

export const LightTheme: ThemeI = {
    primary: "#EE7E06",
    background: "#f4f4f4",
    foreground: "#f9f9f9",
    error: "",
    success: "",
    dark: "#333333"
}

export const useTheme = create<ThemeStoreI>((set, get) => ({
    name: "light",
    current: LightTheme,
    setTheme: (name: ThemeMode, theme: ThemeI) => {
        set({ ...get(), name: name, current: theme })
    },
    getBackgroundColor: (mode: BackgroundMode) => {
        return mode == "background" ? get()?.current?.background : get()?.current?.foreground
    }
}))

