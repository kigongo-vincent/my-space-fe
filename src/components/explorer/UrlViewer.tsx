import View from "../base/View"
import Text from "../base/Text"
import { FileItem } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { ExternalLink, Globe, Copy, Check } from "lucide-react"
import { useState } from "react"

interface Props {
    file: FileItem
}

const UrlViewer = ({ file }: Props) => {
    const { current } = useTheme()
    const [copied, setCopied] = useState(false)

    const url = file.url || ""
    const displayName = file.name.replace('.url', '')

    const handleOpen = () => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }

    const handleCopy = () => {
        if (url) {
            navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <View 
            className="h-full flex flex-col items-center justify-center p-8 gap-6"
            style={{ backgroundColor: current?.background }}
        >
            <View 
                className="p-6 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: current?.primary + "15" }}
            >
                <Globe size={48} color={current?.primary} />
            </View>

            <View className="flex flex-col items-center gap-2 max-w-md text-center">
                <Text 
                    value={displayName} 
                    className="font-semibold text-xl mb-2"
                    style={{ color: current?.dark }}
                />
                <Text 
                    value={url} 
                    size="sm" 
                    className="opacity-60 break-all"
                    style={{ color: current?.dark }}
                />
            </View>

            <View className="flex items-center gap-3 mt-4">
                <button
                    onClick={handleOpen}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{
                        backgroundColor: current?.primary,
                        color: "white"
                    }}
                >
                    <ExternalLink size={18} />
                    <span>Open Link</span>
                </button>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{
                        backgroundColor: current?.dark + "08",
                        color: current?.dark
                    }}
                >
                    {copied ? <Check size={18} color={current?.success || "#10b981"} /> : <Copy size={18} />}
                    <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
            </View>
        </View>
    )
}

export default UrlViewer
