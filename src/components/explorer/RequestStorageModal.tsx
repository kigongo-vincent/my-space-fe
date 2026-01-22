import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { X } from "lucide-react"
import api from "../../utils/api"
import AnimatedModal from "../base/AnimatedModal"

interface Props {
    onClose: () => void
    onSuccess?: () => void
}

const RequestStorageModal = ({ onClose, onSuccess }: Props) => {
    const { current } = useTheme()
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

        setIsSubmitting(true)
        try {
            await api.post("/storage-requests", {
                type: "increment",
                requestedGB: gb,
                reason: reason.trim() || undefined,
            })
            onSuccess?.()
            onClose()
        } catch (err: any) {
            setError(err.message || "Failed to submit request")
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
                    <Text value="Request More Storage" className="font-semibold text-xl" />
                    <IconButton
                        icon={<X size={18} color={current?.dark} />}
                        action={onClose}
                    />
                </View>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <View className="flex flex-col gap-2">
                        <Text value="Requested Storage (GB)" className="font-medium" />
                        <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={requestedGB}
                            onChange={(e) => setRequestedGB(e.target.value)}
                            placeholder="e.g., 50"
                            className="px-4 py-2 rounded-lg border"
                            style={{
                                backgroundColor: current?.background,
                                borderColor: current?.dark + "20",
                                color: current?.dark,
                            }}
                            required
                        />
                        <Text value="Enter the amount of additional storage you need in GB" size="sm" className="opacity-60" />
                    </View>

                    <View className="flex flex-col gap-2">
                        <Text value="Reason (Optional)" className="font-medium" />
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you need additional storage..."
                            rows={4}
                            className="px-4 py-2 rounded-lg border resize-none"
                            style={{
                                backgroundColor: current?.background,
                                borderColor: current?.dark + "20",
                                color: current?.dark,
                            }}
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
                                backgroundColor: current?.dark + "10",
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

export default RequestStorageModal
