import { create } from "zustand"

type ThemeMode = "light" | "dark"
type BackgroundMode = "background" | "foreground" | ""

export interface ThemeStoreI {
    name: ThemeMode
    current: ThemeI
    setTheme: (name: ThemeMode, theme: ThemeI) => void
    toggleTheme: () => void
    getBackgroundColor: (mode: BackgroundMode) => string
}

export interface ThemeI {
    primary: string
    background: string
    foreground: string
    error: string
    success: string
    dark: string
    warning?: string
}

export const LightTheme: ThemeI = {
    primary: "#EE7E06",
    background: "#f4f4f4",
    foreground: "#f9f9f9",
    error: "#ef4444",
    success: "#10b981",
    dark: "#333333",
    warning: "#f59e0b"
}

export const DarkTheme: ThemeI = {
    primary: "#EE7E06", // Keep orange primary, or use "#1DB954" for Spotify green
    background: "#121212", // Spotify's main background
    foreground: "#181818", // Spotify's card/surface background
    error: "#e22134", // Spotify's error red
    success: "#1DB954", // Spotify green
    dark: "#ffffff", // White text on dark background
    warning: "#f59e0b"
}

export const useTheme = create<ThemeStoreI>((set, get) => ({
    name: "light",
    current: LightTheme,
    setTheme: (name: ThemeMode, theme: ThemeI) => {
        set({ ...get(), name: name, current: theme })
    },
    toggleTheme: () => {
        const currentName = get().name
        const newName = currentName === "light" ? "dark" : "light"
        const newTheme = newName === "light" ? LightTheme : DarkTheme
        set({ name: newName, current: newTheme })

        // Update document body class for global dark mode
        if (newName === "dark") {
            document.documentElement.classList.add("dark")
            document.body.style.backgroundColor = newTheme.background
        } else {
            document.documentElement.classList.remove("dark")
            document.body.style.backgroundColor = newTheme.background
        }
    },
    getBackgroundColor: (mode: BackgroundMode) => {
        return mode == "background" ? get()?.current?.background : get()?.current?.foreground
    }
}))

