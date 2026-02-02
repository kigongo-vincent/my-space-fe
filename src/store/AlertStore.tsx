import { create } from "zustand"

export type AlertType = "error" | "success" | "info" | "warning"

interface AlertState {
    isOpen: boolean
    message: string
    type: AlertType
    title?: string
}

interface AlertStore extends AlertState {
    show: (message: string, type?: AlertType, title?: string) => void
    close: () => void
}

const initialState: AlertState = {
    isOpen: false,
    message: "",
    type: "error",
}

export const useAlertStore = create<AlertStore>((set) => ({
    ...initialState,

    show: (message, type = "error", title) => {
        set({
            isOpen: true,
            message,
            type,
            title,
        })
    },

    close: () => {
        set(initialState)
    },
}))
