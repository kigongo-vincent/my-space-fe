import { useState, useEffect, useRef } from "react"
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
    fileId: string
    currentName: string
    onClose: () => void
}

const RenameModal = ({ fileId, currentName, onClose }: Props) => {
    const [newName, setNewName] = useState(currentName)
    const { renameFile } = useFileStore()
    const { current } = useTheme()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        // Select filename without extension
        const lastDot = currentName.lastIndexOf(".")
        if (lastDot > 0) {
            inputRef.current?.setSelectionRange(0, lastDot)
        } else {
            inputRef.current?.select()
        }
    }, [])

    const handleRename = () => {
        if (newName.trim() && newName.trim() !== currentName) {
            renameFile(fileId, newName.trim())
            onClose()
        }
    }

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="lg" position="center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 flex flex-col gap-4 min-w-[420px]"
                style={{ backgroundColor: current?.foreground }}
            >
                <View className="flex items-center justify-between">
                    <Text value="Rename" className="font-semibold text-lg" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-3 rounded-lg outline-none"
                    style={{
                        backgroundColor: current?.background,
                        color: current?.dark
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename()
                        if (e.key === "Escape") onClose()
                    }}
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
                    <Button title="Rename" action={handleRename} />
                </View>
            </motion.div>
        </AnimatedModal>
    )
}

export default RenameModal
