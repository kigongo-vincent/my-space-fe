import { create } from "zustand"
import api from "../utils/api"

type ThemeMode = "light" | "dark"
type BackgroundMode = "background" | "foreground" | ""
export type FontSizePreset = "sm" | "md" | "normal" | "large"

const FONT_SIZE_MAP: Record<FontSizePreset, string> = {
    sm: "13.5px",
    md: "14px",
    normal: "16px",
    large: "18px",
}

export interface ThemeStoreI {
    name: ThemeMode
    current: ThemeI
    baseFontSize: FontSizePreset
    fontFamily: string
    reducedMotion: boolean
    setTheme: (name: ThemeMode, theme: ThemeI) => void
    toggleTheme: () => void
    setPrimary: (color: string) => void
    setBaseFontSize: (size: FontSizePreset) => void
    setFontFamily: (family: string) => void
    setReducedMotion: (enabled: boolean) => void
    getBackgroundColor: (mode: BackgroundMode) => string
    applySettingsFromBackend: (settings: Record<string, unknown>) => void
    syncSettingsToBackendNow: () => void
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null
const doSync = (get: () => ThemeStoreI) => {
    if (!localStorage.getItem("token")) return
    const { name, current, baseFontSize, fontFamily, reducedMotion } = get()
    const dataCollection: Record<string, boolean> = {}
    for (const k of ["analytics", "marketing", "insights"]) {
        const v = localStorage.getItem(`settings.data.${k}`)
        dataCollection[k] = v !== "false"
    }
    api.put("/users/me/settings", {
        theme: name,
        accent: current?.primary,
        fontSize: baseFontSize,
        fontFamily,
        reducedMotion,
        dataCollection,
    }).catch(() => {})
}
const syncSettingsToBackend = (get: () => ThemeStoreI) => {
    if (!localStorage.getItem("token")) return
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
        syncTimeout = null
        doSync(get)
    }, 300)
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

const loadStoredTheme = (): ThemeMode => {
    const v = localStorage.getItem("settings.appearance.theme")
    return v === "dark" ? "dark" : "light"
}

const loadStoredAccent = (): string => {
    const v = localStorage.getItem("settings.appearance.accent")
    if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) return v
    return "#EE7E06"
}

const loadStoredFontSize = (): FontSizePreset => {
    const v = localStorage.getItem("settings.appearance.fontSize")
    if (v === "sm" || v === "md" || v === "normal" || v === "large") return v
    return "sm"
}

const loadReducedMotion = (): boolean => {
    return localStorage.getItem("settings.appearance.reducedMotion") === "true"
}

const loadStoredFontFamily = (): string => {
    const v = localStorage.getItem("settings.appearance.fontFamily")
    return v && v.trim() ? v : "Poppins"
}

const loadGoogleFont = (family: string) => {
    const id = "google-font-dynamic"
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
        link = document.createElement("link")
        link.id = id
        link.rel = "stylesheet"
        document.head.appendChild(link)
    }
    const encoded = family.replace(/ /g, "+")
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`
}

const applyFontFamilyToDocument = (family: string) => {
    document.documentElement.style.setProperty("--font-family", `"${family}", sans-serif`)
    const isGoogleFont = !["Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana", "system-ui"].includes(family)
    if (isGoogleFont) loadGoogleFont(family)
}

const applyThemeToDocument = (name: ThemeMode, theme: ThemeI) => {
    if (name === "dark") {
        document.documentElement.classList.add("dark")
    } else {
        document.documentElement.classList.remove("dark")
    }
    document.body.style.backgroundColor = theme.background
}

const applyFontSizeToDocument = (preset: FontSizePreset) => {
    document.documentElement.style.setProperty("--base-font-size", FONT_SIZE_MAP[preset])
}

/** Re-apply stored appearance settings to document. Call on app mount to ensure global application. */
export const applyAppearanceSettings = () => {
    applyFontSizeToDocument(loadStoredFontSize())
    applyFontFamilyToDocument(loadStoredFontFamily())
    applyReducedMotion(loadReducedMotion())
}

const applyReducedMotion = (enabled: boolean) => {
    if (enabled) {
        document.documentElement.classList.add("reduce-motion")
    } else {
        document.documentElement.classList.remove("reduce-motion")
    }
}

export const useTheme = create<ThemeStoreI>((set, get) => {
    const storedTheme = loadStoredTheme()
    const storedAccent = loadStoredAccent()
    const storedFontSize = loadStoredFontSize()
    const storedFontFamily = loadStoredFontFamily()
    const storedReducedMotion = loadReducedMotion()

    const baseLight = { ...LightTheme, primary: storedAccent }
    const baseDark = { ...DarkTheme, primary: storedAccent }
    const initialTheme = storedTheme === "light" ? baseLight : baseDark

    applyThemeToDocument(storedTheme, initialTheme)
    applyFontSizeToDocument(storedFontSize)
    applyFontFamilyToDocument(storedFontFamily)
    applyReducedMotion(storedReducedMotion)

    return {
        name: storedTheme,
        current: initialTheme,
        baseFontSize: storedFontSize,
        fontFamily: storedFontFamily,
        reducedMotion: storedReducedMotion,
        setTheme: (name: ThemeMode, theme: ThemeI) => {
            set({ ...get(), name, current: theme })
            localStorage.setItem("settings.appearance.theme", name)
            applyThemeToDocument(name, theme)
            syncSettingsToBackend(get)
        },
        toggleTheme: () => {
            const currentName = get().name
            const newName = currentName === "light" ? "dark" : "light"
            const accent = get().current.primary
            const newTheme = newName === "light"
                ? { ...LightTheme, primary: accent }
                : { ...DarkTheme, primary: accent }
            set({ name: newName, current: newTheme })
            localStorage.setItem("settings.appearance.theme", newName)
            applyThemeToDocument(newName, newTheme)
            syncSettingsToBackend(get)
        },
        setPrimary: (color: string) => {
            const { name, current } = get()
            const updated = { ...current, primary: color }
            set({ current: updated })
            localStorage.setItem("settings.appearance.accent", color)
            applyThemeToDocument(name, updated)
            syncSettingsToBackend(get)
        },
        setBaseFontSize: (size: FontSizePreset) => {
            set({ ...get(), baseFontSize: size })
            localStorage.setItem("settings.appearance.fontSize", size)
            applyFontSizeToDocument(size)
            syncSettingsToBackend(get)
        },
        setFontFamily: (family: string) => {
            set({ ...get(), fontFamily: family })
            localStorage.setItem("settings.appearance.fontFamily", family)
            applyFontFamilyToDocument(family)
            syncSettingsToBackend(get)
        },
        setReducedMotion: (enabled: boolean) => {
            set({ ...get(), reducedMotion: enabled })
            localStorage.setItem("settings.appearance.reducedMotion", String(enabled))
            applyReducedMotion(enabled)
            syncSettingsToBackend(get)
        },
        syncSettingsToBackendNow: () => {
            doSync(get)
        },
        applySettingsFromBackend: (settings: Record<string, unknown>) => {
            const g = get()
            if (settings.theme === "dark" || settings.theme === "light") {
                const accent = (settings.accent as string) || g.current?.primary
                const newTheme = settings.theme === "light"
                    ? { ...LightTheme, primary: accent }
                    : { ...DarkTheme, primary: accent }
                set({ name: settings.theme as ThemeMode, current: newTheme })
                localStorage.setItem("settings.appearance.theme", settings.theme as string)
                applyThemeToDocument(settings.theme as ThemeMode, newTheme)
            }
            if (settings.accent && /^#[0-9A-Fa-f]{6}$/.test(settings.accent as string)) {
                const { name, current } = get()
                const updated = { ...current, primary: settings.accent as string }
                set({ current: updated })
                localStorage.setItem("settings.appearance.accent", settings.accent as string)
                applyThemeToDocument(name, updated)
            }
            if (["sm", "md", "normal", "large"].includes(settings.fontSize as string)) {
                set({ ...get(), baseFontSize: settings.fontSize as FontSizePreset })
                localStorage.setItem("settings.appearance.fontSize", settings.fontSize as string)
                applyFontSizeToDocument(settings.fontSize as FontSizePreset)
            }
            if (settings.fontFamily && typeof settings.fontFamily === "string") {
                set({ ...get(), fontFamily: settings.fontFamily as string })
                localStorage.setItem("settings.appearance.fontFamily", settings.fontFamily as string)
                applyFontFamilyToDocument(settings.fontFamily as string)
            }
            if (typeof settings.reducedMotion === "boolean") {
                set({ ...get(), reducedMotion: settings.reducedMotion })
                localStorage.setItem("settings.appearance.reducedMotion", String(settings.reducedMotion))
                applyReducedMotion(settings.reducedMotion)
            }
            const dc = settings.dataCollection as Record<string, boolean> | undefined
            if (dc && typeof dc === "object") {
                for (const [k, v] of Object.entries(dc)) {
                    localStorage.setItem(`settings.data.${k}`, String(v))
                }
            }
        },
        getBackgroundColor: (mode: BackgroundMode) => {
            return mode == "background" ? get()?.current?.background : get()?.current?.foreground
        },
    }
})

