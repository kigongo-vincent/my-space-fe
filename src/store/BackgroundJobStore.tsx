import { create } from "zustand"
import api from "../utils/api"

export interface BackgroundJob {
  id: number
  userId: number
  type: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  message: string
  error?: string
  result?: string
  createdAt: string
  updatedAt: string
}

interface BackgroundJobStore {
  jobs: BackgroundJob[]
  activeJobs: BackgroundJob[]
  addJob: (job: BackgroundJob) => void
  updateJob: (id: number, updates: Partial<BackgroundJob>) => void
  removeJob: (id: number) => void
  fetchJobs: () => Promise<void>
  pollJob: (id: number) => Promise<void>
}

export const useBackgroundJobStore = create<BackgroundJobStore>((set, get) => ({
  jobs: [],
  activeJobs: [],

  addJob: (job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
      activeJobs: job.status !== "completed" && job.status !== "failed"
        ? [job, ...state.activeJobs]
        : state.activeJobs,
    }))
  },

  updateJob: (id, updates) => {
    set((state) => {
      const updatedJobs = state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      )

      const activeJobs = updatedJobs.filter(
        (job) => job.status !== "completed" && job.status !== "failed"
      )

      return {
        jobs: updatedJobs,
        activeJobs,
      }
    })
  },

  removeJob: (id) => {
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      activeJobs: state.activeJobs.filter((job) => job.id !== id),
    }))
  },

  fetchJobs: async () => {
    try {
      const jobs = await api.get<BackgroundJob[]>("/jobs")
      set({
        jobs,
        activeJobs: jobs.filter(
          (job) => job.status !== "completed" && job.status !== "failed"
        ),
      })
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    }
  },

  pollJob: async (id) => {
    try {
      const job = await api.get<BackgroundJob>(`/jobs/${id}`)
      get().updateJob(id, job)

      if (job.status === "pending" || job.status === "processing") {
        setTimeout(() => get().pollJob(id), 2000)
      }
    } catch (error) {
      console.error("Failed to poll job:", error)
    }
  },
}))
