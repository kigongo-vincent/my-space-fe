import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import Button from "../base/Button"
import { useFileStore } from "../../store/Filestore"
import { X } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import AnimatedModal from "../base/AnimatedModal"
import { motion } from "framer-motion"

interface Props {
    onClose: () => void
    parentId: string | null
    diskId: string
}

const CreateFolderModal = ({ onClose, parentId, diskId }: Props) => {
    const [folderName, setFolderName] = useState("")
    const { createFolder } = useFileStore()
    const { current } = useTheme()

    const handleCreate = async () => {
        if (folderName.trim()) {
            try {
                await createFolder(folderName.trim(), parentId, diskId)
                onClose()
            } catch (error) {
                // Error is already handled in createFolder
            }
        }
    }

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="md" position="center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 flex flex-col gap-4 min-w-[400px]"
                style={{ backgroundColor: current?.foreground }}
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
            </motion.div>
        </AnimatedModal>
    )
}

export default CreateFolderModal
