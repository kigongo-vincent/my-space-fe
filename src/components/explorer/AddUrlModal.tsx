import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { X, Link2, ExternalLink, AlertCircle, CheckCircle } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"

interface Props {
    onClose: () => void
    parentId: string | null
    diskId: string
}

const AddUrlModal = ({ onClose, parentId, diskId }: Props) => {
    const [urlName, setUrlName] = useState("")
    const [url, setUrl] = useState("")
    const { createUrl } = useFileStore()
    const { current, name } = useTheme()

    const isValidUrl = (string: string) => {
        try {
            const urlObj = new URL(string)
            return urlObj.protocol === "http:" || urlObj.protocol === "https:"
        } catch (_) {
            return false
        }
    }

    const urlValid = url.trim() ? isValidUrl(url.trim()) : null
    const isFormValid = urlName.trim().length >= 3 && urlValid === true

    const handleCreate = () => {
        if (isFormValid) {
            createUrl(urlName.trim(), url.trim(), parentId, diskId)
            onClose()
        }
    }

    const handleUrlChange = (value: string) => {
        // Auto-format URL
        let formatted = value.trim()
        if (formatted && !formatted.match(/^https?:\/\//)) {
            formatted = "https://" + formatted
        }
        setUrl(formatted)
    }

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: 'blur(2px)' }}>
            <View
                mode="foreground"
                className="p-8 rounded-xl min-w-[550px] max-w-[650px] flex flex-col gap-6"
                style={{
                    border: `1px solid ${current?.dark}10`,
                    boxShadow: name === "dark" 
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                {/* Header */}
                <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                        <View 
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: current?.primary + "15" }}
                        >
                            <Link2 size={24} color={current?.primary} />
                        </View>
                        <View>
                            <Text value="Add URL" className="font-semibold text-xl" />
                            <Text value="Save and organize your links" size="sm" className="opacity-60 mt-0.5" />
                        </View>
                    </View>
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* URL Name */}
                <View className="flex flex-col gap-2">
                    <Text value="Link Name" className="font-medium text-sm" style={{ color: current?.dark + "CC" }} />
                    <input
                        type="text"
                        value={urlName}
                        onChange={(e) => setUrlName(e.target.value)}
                        placeholder="e.g., My Favorite Blog"
                        className="w-full p-4 rounded-lg outline-none transition-all"
                        style={{
                            backgroundColor: current?.background,
                            color: current?.dark,
                            border: "none",
                            fontSize: "15px"
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") onClose()
                            if (e.key === "Enter" && isFormValid) handleCreate()
                        }}
                        autoFocus
                        maxLength={100}
                    />
                    {urlName && (
                        <Text 
                            value={`${urlName.length}/100 characters`} 
                            size="sm" 
                            className="opacity-50 ml-1" 
                        />
                    )}
                </View>

                {/* URL */}
                <View className="flex flex-col gap-2">
                    <Text value="URL" className="font-medium text-sm" style={{ color: current?.dark + "CC" }} />
                    <div className="relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full p-4 rounded-lg outline-none transition-all pr-10"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                border: "none",
                                fontSize: "15px"
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") onClose()
                                if (e.key === "Enter" && isFormValid) handleCreate()
                            }}
                        />
                        {url && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {urlValid ? (
                                    <CheckCircle size={18} color={current?.success || "#10b981"} />
                                ) : urlValid === false ? (
                                    <AlertCircle size={18} color={current?.error || "#ef4444"} />
                                ) : null}
                            </div>
                        )}
                    </div>
                    {url && urlValid === false && (
                        <View className="flex items-center gap-2 text-sm mt-1">
                            <AlertCircle size={14} color={current?.error || "#ef4444"} />
                            <Text 
                                value="Please enter a valid URL (e.g., https://example.com)" 
                                size="sm" 
                                style={{ color: current?.error || "#ef4444" }} 
                            />
                        </View>
                    )}
                    {url && urlValid && (
                        <View className="flex items-center gap-2 text-sm mt-1">
                            <CheckCircle size={14} color={current?.success || "#10b981"} />
                            <Text 
                                value="Valid URL" 
                                size="sm" 
                                style={{ color: current?.success || "#10b981" }} 
                            />
                        </View>
                    )}
                </View>

                {/* Preview */}
                {url && urlValid && (
                    <View 
                        className="p-4 rounded-lg flex items-center gap-3"
                        style={{ backgroundColor: current?.primary + "08" }}
                    >
                        <ExternalLink size={18} color={current?.primary} />
                        <View className="flex-1 min-w-0">
                            <Text value={urlName || "Untitled Link"} className="font-medium truncate" />
                            <Text value={url} size="sm" className="opacity-60 truncate" />
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View className="flex items-center gap-3 justify-end pt-2 border-t" style={{ borderColor: current?.dark + "10" }}>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg transition-all hover:opacity-80 font-medium"
                        style={{
                            backgroundColor: current?.dark + "08",
                            color: current?.dark,
                            fontSize: "14px"
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!isFormValid}
                        className="px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        style={{
                            boxShadow: name === "dark" 
                                ? `0 4px 6px -1px rgba(0, 0, 0, 0.3)`
                                : `0 4px 6px -1px ${current?.dark}10`,
                            backgroundColor: isFormValid ? current?.primary : current?.dark + "20",
                            color: isFormValid ? "white" : current?.dark + "60",
                            fontSize: "14px"
                        }}
                    >
                        Add URL
                    </button>
                </View>
            </View>
        </View>
    )
}

export default AddUrlModal
