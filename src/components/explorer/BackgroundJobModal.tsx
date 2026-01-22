import { useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { useBackgroundJobStore, BackgroundJob } from "../../store/BackgroundJobStore"
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react"

const BackgroundJobModal = () => {
  const { current, name } = useTheme()
  const { activeJobs, removeJob, pollJob } = useBackgroundJobStore()

  useEffect(() => {
    activeJobs.forEach((job) => {
      if (job.status === "pending" || job.status === "processing") {
        pollJob(job.id)
      }
    })
  }, [activeJobs, pollJob])

  if (activeJobs.length === 0) return null

  return (
    <View
      className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50"
      style={{
        backgroundColor: current?.foreground,
        borderRadius: "0.5rem",
        boxShadow:
          name === "dark"
            ? `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
            : `0 20px 25px -5px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`,
      }}
    >
      <View
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: current?.dark + "20" }}
      >
        <Text
          value="Background Processes"
          className="font-semibold"
          style={{ color: current?.dark }}
        />
        <Text
          value={`${activeJobs.length} active`}
          size="sm"
          className="opacity-70"
        />
      </View>

      <View className="p-2">
        {activeJobs.map((job) => (
          <JobItem key={job.id} job={job} onClose={() => removeJob(job.id)} />
        ))}
      </View>
    </View>
  )
}

interface JobItemProps {
  job: BackgroundJob
  onClose: () => void
}

const JobItem = ({ job, onClose }: JobItemProps) => {
  const { current } = useTheme()

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle size={16} color="#10b981" />
      case "failed":
        return <XCircle size={16} color="#ef4444" />
      default:
        return <Loader2 size={16} className="animate-spin" color={current?.primary} />
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "#10b981"
      case "failed":
        return "#ef4444"
      default:
        return current?.primary
    }
  }

  return (
    <View
      className="flex flex-col gap-2 p-3 mb-2 rounded"
      style={{
        backgroundColor: current?.background,
        border: `1px solid ${current?.dark}10`,
      }}
    >
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-2">
          {getStatusIcon()}
          <Text
            value={job.type}
            className="font-medium text-sm"
            style={{ color: current?.dark }}
          />
        </View>
        <button
          onClick={onClose}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <X size={16} color={current?.dark} />
        </button>
      </View>

      <Text
        value={job.message}
        size="sm"
        className="opacity-70"
        style={{ color: current?.dark }}
      />

      {(job.status === "pending" || job.status === "processing") && (
        <View className="flex flex-col gap-1">
          <View
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: current?.dark + "10" }}
          >
            <View
              className="h-full transition-all duration-300"
              style={{
                width: `${job.progress}%`,
                backgroundColor: getStatusColor(),
              }}
            />
          </View>
          <Text
            value={`${job.progress}%`}
            size="sm"
            className="opacity-70 text-right"
            style={{ color: current?.dark }}
          />
        </View>
      )}

      {job.error && (
        <Text
          value={job.error}
          size="sm"
          style={{ color: "#ef4444" }}
        />
      )}
    </View>
  )
}

export default BackgroundJobModal
