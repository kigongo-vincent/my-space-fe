import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import Button from "../base/Button"
import { useFileStore } from "../../store/Filestore"
import { X, FileText, Sparkles } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import AnimatedModal from "../base/AnimatedModal"

interface Props {
    onClose: () => void
    parentId: string | null
    diskId: string
}

const CreateNoteModal = ({ onClose, parentId, diskId }: Props) => {
    const [noteName, setNoteName] = useState("")
    const [noteContent, setNoteContent] = useState("")
    const { createNote } = useFileStore()
    const { current, name } = useTheme()

    const handleCreate = () => {
        if (noteName.trim() && noteContent.trim()) {
            createNote(noteName.trim(), noteContent.trim(), parentId, diskId)
            onClose()
        }
    }

    const isFormValid = noteName.trim().length >= 3 && noteContent.trim().length > 0

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="lg" position="center">
            <div
                className="rounded-xl min-w-[700px] max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col"
                style={{
                    border: `1px solid ${current?.dark}10`,
                    backgroundColor: current?.foreground,
                    width: 'auto'
                }}
            >
                {/* Header - Apple Notes style */}
                <View 
                    className="px-6 py-4 border-b flex items-center justify-between"
                    style={{ 
                        borderColor: current?.dark + "10",
                        backgroundColor: current?.foreground
                    }}
                >
                    <View className="flex items-center gap-3">
                        <FileText size={20} color={current?.primary} />
                        <Text value="New Note" className="font-semibold" />
                    </View>
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* Title Input - Apple Notes style */}
                <View 
                    className="px-6 py-3 border-b"
                    style={{ 
                        borderColor: current?.dark + "10",
                        backgroundColor: current?.foreground
                    }}
                >
                    <input
                        type="text"
                        value={noteName}
                        onChange={(e) => setNoteName(e.target.value)}
                        placeholder="Title"
                        className="w-full outline-none"
                        style={{
                            backgroundColor: "transparent",
                            color: current?.dark,
                            border: "none",
                            fontSize: "20px",
                            fontWeight: "600",
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") onClose()
                        }}
                        autoFocus
                        maxLength={100}
                    />
                </View>

                {/* Content Area - Apple Notes style */}
                <View className="flex-1 overflow-auto">
                    <View className="p-6 max-w-3xl mx-auto h-full">
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Start writing..."
                            className="w-full h-full outline-none resize-none"
                            style={{
                                backgroundColor: "transparent",
                                color: current?.dark,
                                border: "none",
                                fontSize: "16px",
                                lineHeight: "1.6",
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                                minHeight: "400px"
                            }}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault()
                                    if (isFormValid) handleCreate()
                                }
                                if (e.key === "Escape") onClose()
                            }}
                        />
                    </View>
                </View>

                {/* Footer */}
                <View 
                    className="px-6 py-3 border-t flex items-center justify-end gap-3"
                    style={{ 
                        borderColor: current?.dark + "10",
                        backgroundColor: current?.foreground
                    }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg transition-all hover:opacity-80 text-sm"
                        style={{
                            backgroundColor: current?.dark + "08",
                            color: current?.dark
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!isFormValid}
                        className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        style={{
                            backgroundColor: isFormValid ? current?.primary : current?.dark + "20",
                            color: isFormValid ? "white" : current?.dark + "60"
                        }}
                    >
                        Create
                    </button>
                </View>
            </div>
        </AnimatedModal>
    )
}

export default CreateNoteModal
