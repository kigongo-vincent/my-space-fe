import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import Button from "../base/Button"
import { useFileStore } from "../../store/Filestore"
import { X } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"

interface Props {
    onClose: () => void
    parentId: string | null
    diskId: string
}

const CreateFolderModal = ({ onClose, parentId, diskId }: Props) => {
    const [folderName, setFolderName] = useState("")
    const { createFolder } = useFileStore()
    const { current, name } = useTheme()

    const handleCreate = () => {
        if (folderName.trim()) {
            createFolder(folderName.trim(), parentId, diskId)
            onClose()
        }
    }

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: 'blur(2px)' }}>
            <View
                mode="foreground"
                className="p-6 rounded-md min-w-[400px] flex flex-col gap-4"
                style={{
                    boxShadow: name === "dark" 
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                <View className="flex items-center justify-between">
                    <Text value="Create New Folder" className="font-semibold text-lg" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full p-3 rounded-lg outline-none"
                    style={{
                        backgroundColor: current?.background,
                        color: current?.dark,
                        border: "none"
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate()
                        if (e.key === "Escape") onClose()
                    }}
                    autoFocus
                />

                <View className="flex items-center gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 rounded-md h-10"
                        style={{
                            backgroundColor: current?.background,
                            color: current?.dark,
                            fontSize: "13px"
                        }}
                    >
                        Cancel
                    </button>
                    <Button title="Create" action={handleCreate} />
                </View>
            </View>
        </View>
    )
}

export default CreateFolderModal
