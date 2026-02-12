import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import IconButton from "../base/IconButton"
import Select from "../base/Select"
import { useTheme } from "../../store/Themestore"
import { X } from "lucide-react"
import api from "../../utils/api"
import AnimatedModal from "../base/AnimatedModal"
import { convertToGB } from "../../utils/storage"

type StorageUnit = "MB" | "GB" | "TB"

interface Props {
    onClose: () => void
    onSuccess?: () => void
}

const RequestStorageModal = ({ onClose, onSuccess }: Props) => {
    const { current } = useTheme()
    const [requestedAmount, setRequestedAmount] = useState("")
    const [requestedUnit, setRequestedUnit] = useState<StorageUnit>("GB")
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const amount = parseFloat(requestedAmount)
        if (!amount || amount <= 0) {
            setError("Please enter a valid amount")
            return
        }

        const gb = convertToGB(amount, requestedUnit)
        if (gb <= 0) {
            setError("Please enter a valid amount")
            return
        }

        setIsSubmitting(true)
        try {
            const requestedGBWhole = Math.round(gb)
            await api.post("/storage-requests", {
                type: "increment",
                requestedGB: requestedGBWhole,
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
        <AnimatedModal isOpen={true} onClose={onClose} size="lg" position="center">
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
                        <Text value="Requested Storage" className="font-medium" />
                        <View className="flex gap-2 items-stretch" style={{ minHeight: "2.75rem" }}>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={requestedAmount}
                                onChange={(e) => setRequestedAmount(e.target.value.replace(/[^\d.]/g, ""))}
                                placeholder="e.g. 50"
                                className="flex-1 px-4 py-2 rounded-lg min-w-0"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    outline: "none",
                                }}
                                required
                            />
                            <View className="w-20 flex-shrink-0" style={{ overflow: "visible" }}>
                                <Select
                                    value={requestedUnit}
                                    onChange={(v) => setRequestedUnit(v as StorageUnit)}
                                    options={[
                                        { value: "MB", label: "MB" },
                                        { value: "GB", label: "GB" },
                                        { value: "TB", label: "TB" },
                                    ]}
                                    useBackgroundMode
                                />
                            </View>
                        </View>
                        <Text value="Enter the amount of additional storage you need" size="sm" className="opacity-60" />
                    </View>

                    <View className="flex flex-col gap-2">
                        <Text value="Reason (Optional)" className="font-medium" />
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you need additional storage..."
                            rows={4}
                            className="px-4 py-2 rounded-lg resize-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                outline: "none",
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

export default RequestStorageModal
