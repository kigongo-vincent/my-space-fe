import { useState, useEffect } from "react"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import { Check, X, Clock } from "lucide-react"
import api from "../../utils/api"

interface StorageRequest {
    id: number
    userId: number
    requestedGB: number
    reason?: string
    status: "pending" | "approved" | "denied"
    reviewedBy?: number
    reviewedAt?: string
    createdAt: string
    user?: {
        id: number
        username: string
        email: string
    }
}

const StorageRequests = () => {
    const { current } = useTheme()
    const [requests, setRequests] = useState<StorageRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("all")
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [filter])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            const endpoint = filter === "pending" ? "/storage-requests/pending" : "/storage-requests"
            const data = await api.get<StorageRequest[]>(endpoint, true)
            setRequests(data)
        } catch (error) {
            console.error("Failed to fetch requests:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: number, status: "approved" | "denied") => {
        try {
            setProcessingId(id)
            await api.patch(`/storage-requests/${id}/status`, { status })
            await fetchRequests()
            // Refresh users to get updated storage
            if (status === "approved") {
                window.location.reload() // Simple refresh to update user storage
            }
        } catch (error: any) {
            alert(error.message || "Failed to update request status")
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "#10b981"
            case "denied":
                return "#ef4444"
            default:
                return current?.primary || "#EE7E06"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <Check size={16} />
            case "denied":
                return <X size={16} />
            default:
                return <Clock size={16} />
        }
    }

    const filteredRequests = filter === "all" 
        ? requests 
        : requests.filter(r => r.status === filter)

    return (
        <View className="h-full flex flex-col" style={{ backgroundColor: current?.background }}>
            <View className="p-8 border-b" style={{ borderColor: current?.dark + "15" }}>
                <Text value="Storage Requests" className="font-semibold text-2xl mb-2" />
                <Text value="Review and manage user storage increase requests" size="sm" className="opacity-60" />
            </View>

            {/* Filters */}
            <View className="px-8 pt-6 flex items-center gap-2">
                {(["all", "pending", "approved", "denied"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="px-4 py-2 rounded-lg font-medium transition-all capitalize"
                        style={{
                            backgroundColor: filter === f ? current?.primary + "15" : current?.dark + "08",
                            color: filter === f ? current?.primary : current?.dark,
                        }}
                    >
                        {f}
                    </button>
                ))}
            </View>

            {/* Requests List */}
            <View className="flex-1 overflow-auto p-8">
                {loading ? (
                    <View className="flex items-center justify-center h-64">
                        <Text value="Loading..." className="opacity-60" />
                    </View>
                ) : filteredRequests.length === 0 ? (
                    <View className="flex items-center justify-center h-64">
                        <Text value="No storage requests found" className="opacity-60" />
                    </View>
                ) : (
                    <View className="flex flex-col gap-4">
                        {filteredRequests.map((request) => (
                            <View
                                key={request.id}
                                className="p-6 rounded-lg border"
                                style={{
                                    backgroundColor: current?.foreground,
                                    borderColor: current?.dark + "15",
                                }}
                            >
                                <View className="flex items-start justify-between mb-4">
                                    <View className="flex-1">
                                        <View className="flex items-center gap-3 mb-2">
                                            <Text value={request.user?.username || `User #${request.userId}`} className="font-semibold text-lg" />
                                            <View
                                                className="px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium"
                                                style={{
                                                    backgroundColor: getStatusColor(request.status) + "15",
                                                    color: getStatusColor(request.status),
                                                }}
                                            >
                                                {getStatusIcon(request.status)}
                                                <span className="capitalize">{request.status}</span>
                                            </View>
                                        </View>
                                        <Text value={request.user?.email || ""} size="sm" className="opacity-60 mb-1" />
                                        <Text value={`Requested: ${request.requestedGB} GB`} className="font-medium" />
                                        {request.reason && (
                                            <View className="mt-2 p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                                <Text value={request.reason} size="sm" />
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View className="flex items-center justify-between pt-4 border-t" style={{ borderColor: current?.dark + "15" }}>
                                    <Text 
                                        value={`Requested on ${new Date(request.createdAt).toLocaleDateString()}`} 
                                        size="sm" 
                                        className="opacity-60" 
                                    />
                                    {request.status === "pending" && (
                                        <View className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(request.id, "denied")}
                                                disabled={processingId === request.id}
                                                className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                                style={{
                                                    backgroundColor: "#ef4444" + "15",
                                                    color: "#ef4444",
                                                }}
                                            >
                                                <X size={16} />
                                                Deny
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(request.id, "approved")}
                                                disabled={processingId === request.id}
                                                className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                                style={{
                                                    backgroundColor: current?.primary,
                                                    color: "white",
                                                }}
                                            >
                                                <Check size={16} />
                                                {processingId === request.id ? "Processing..." : "Approve"}
                                            </button>
                                        </View>
                                    )}
                                    {request.status !== "pending" && request.reviewedAt && (
                                        <Text 
                                            value={`${request.status === "approved" ? "Approved" : "Denied"} on ${new Date(request.reviewedAt).toLocaleDateString()}`} 
                                            size="sm" 
                                            className="opacity-60" 
                                        />
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    )
}

export default StorageRequests
