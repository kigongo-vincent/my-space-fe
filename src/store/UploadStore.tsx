import { create } from "zustand"

export interface UploadItem {
    id: string
    file: File
    fileName: string
    progress: number
    status: "pending" | "uploading" | "completed" | "error"
    error?: string
    fileId?: number
    diskId: string
    parentId?: string | null
    uploadedBytes: number
    totalBytes: number
    speed?: number // bytes per second
    startTime?: number
}

export interface UploadStoreI {
    uploads: UploadItem[]
    isOpen: boolean
    isCollapsed: boolean
    addUpload: (file: File, diskId: string, parentId?: string | null) => string
    updateUploadProgress: (id: string, progress: number, uploadedBytes: number) => void
    updateUploadStatus: (id: string, status: UploadItem["status"], error?: string, fileId?: number) => void
    removeUpload: (id: string) => void
    clearCompleted: () => void
    toggleModal: () => void
    toggleCollapse: () => void
    openModal: () => void
    closeModal: () => void
    getActiveUploads: () => UploadItem[]
    getPendingUploads: () => UploadItem[]
    getCompletedUploads: () => UploadItem[]
    getFailedUploads: () => UploadItem[]
}

export const useUploadStore = create<UploadStoreI>((set, get) => ({
    uploads: [],
    isOpen: false,
    isCollapsed: false,

    addUpload: (file: File, diskId: string, parentId?: string | null) => {
        const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const upload: UploadItem = {
            id,
            file,
            fileName: file.name,
            progress: 0,
            status: "pending",
            diskId,
            parentId: parentId || null,
            uploadedBytes: 0,
            totalBytes: file.size,
        }

        set((state) => ({
            uploads: [...state.uploads, upload],
            isOpen: true, // Auto-open when upload starts
        }))

        return id
    },

    updateUploadProgress: (id: string, progress: number, uploadedBytes: number) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload) return

        const now = Date.now()
        const elapsed = upload.startTime ? (now - upload.startTime) / 1000 : 0
        const speed = elapsed > 0 ? uploadedBytes / elapsed : 0

        set((state) => ({
            uploads: state.uploads.map((u) =>
                u.id === id
                    ? {
                          ...u,
                          progress,
                          uploadedBytes,
                          speed,
                          status: u.status === "pending" ? "uploading" : u.status,
                          startTime: u.startTime || now,
                      }
                    : u
            ),
        }))
    },

    updateUploadStatus: (id: string, status: UploadItem["status"], error?: string, fileId?: number) => {
        set((state) => ({
            uploads: state.uploads.map((u) =>
                u.id === id
                    ? {
                          ...u,
                          status,
                          error,
                          fileId,
                          progress: status === "completed" ? 100 : u.progress,
                      }
                    : u
            ),
        }))
    },

    removeUpload: (id: string) => {
        set((state) => ({
            uploads: state.uploads.filter((u) => u.id !== id),
        }))
    },

    clearCompleted: () => {
        set((state) => ({
            uploads: state.uploads.filter((u) => u.status !== "completed"),
        }))
    },

    toggleModal: () => {
        set((state) => ({ isOpen: !state.isOpen }))
    },

    toggleCollapse: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }))
    },

    openModal: () => {
        set({ isOpen: true, isCollapsed: false })
    },

    closeModal: () => {
        set({ isOpen: false })
    },

    getActiveUploads: () => {
        return get().uploads.filter((u) => u.status === "uploading" || u.status === "pending")
    },

    getPendingUploads: () => {
        return get().uploads.filter((u) => u.status === "pending")
    },

    getCompletedUploads: () => {
        return get().uploads.filter((u) => u.status === "completed")
    },

    getFailedUploads: () => {
        return get().uploads.filter((u) => u.status === "error")
    },
}))
