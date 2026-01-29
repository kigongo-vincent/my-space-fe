import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { X } from "lucide-react"
import api from "../../utils/api"
import AnimatedModal from "../base/AnimatedModal"
import { useUser } from "../../store/Userstore"

interface Props {
    onClose: () => void
    onSuccess?: () => void
}

const RequestDecrementModal = ({ onClose, onSuccess }: Props) => {
    const { current } = useTheme()
    const { usage } = useUser()
    const [requestedGB, setRequestedGB] = useState("")
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const gb = parseFloat(requestedGB)
        if (!gb || gb < 1) {
            setError("Please enter a valid amount (minimum 1 GB)")
            return
        }

        // Validate that reduction doesn't exceed current total
        if (!usage) {
            setError("Unable to retrieve current storage information")
            return
        }
        
        const currentTotalGB = usage.unit === "GB" ? usage.total : 
                              usage.unit === "MB" ? usage.total / 1024 :
                              usage.total * 1024 // TB to GB
        
        if (gb >= currentTotalGB) {
            setError(`Cannot reduce storage below current total. Current total: ${usage.total.toFixed(2)} ${usage.unit}`)
            return
        }

        setIsSubmitting(true)
        try {
            await api.post("/storage-requests", {
                type: "decrement",
                requestedGB: gb,
                reason: reason.trim() || undefined,
            })
            onSuccess?.()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to submit request")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="md" position="center">
            <View
                className="p-6 rounded-lg flex flex-col gap-6"
                style={{ backgroundColor: current?.foreground }}
                onClick={(e) => e.stopPropagation()}
            >
                <View className="flex items-center justify-between">
                    <Text value="Request Storage Reduction" className="font-semibold text-xl" />
                    <IconButton
                        icon={<X size={18} color={current?.dark} />}
                        action={onClose}
                    />
                </View>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <View className="flex flex-col gap-2">
                        <Text value="Amount to Reduce (GB)" className="font-medium" />
                        <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={requestedGB}
                            onChange={(e) => setRequestedGB(e.target.value)}
                            placeholder="e.g., 10"
                            className="px-4 py-2 rounded-lg"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                outline: "none",
                            }}
                            required
                        />
                        {usage && <Text value={`Enter the amount of storage to reduce in GB. Current total: ${usage.total.toFixed(2)} ${usage.unit}`} size="sm" className="opacity-60" />}
                    </View>

                    <View className="flex flex-col gap-2">
                        <Text value="Reason (Optional)" className="font-medium" />
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you want to reduce storage..."
                            rows={4}
                            className="px-4 py-2 rounded-lg resize-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                outline: "none",
                            }}
                        />
                    </View>

                    <View
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: (current?.warning || "#f59e0b") + "15" }}
                    >
                        <Text 
                            value="Note: After admin approval, you'll need to delete files to free up the requested amount before the reduction is completed." 
                            size="sm" 
                            style={{ color: current?.warning || "#f59e0b" }} 
                        />
                    </View>

                    {error && (
                        <View
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: (current?.error || "#ef4444") + "15" }}
                        >
                            <Text value={error} size="sm" style={{ color: current?.error || "#ef4444" }} />
                        </View>
                    )}

                    <View className="flex items-center gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                            style={{
                                backgroundColor: current?.foreground,
                                color: current?.dark,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{
                                backgroundColor: current?.primary,
                                color: "white",
                            }}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </View>
                </form>
            </View>
        </AnimatedModal>
    )
}

export default RequestDecrementModal
