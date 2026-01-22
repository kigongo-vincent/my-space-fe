import { useState, useEffect } from "react"
import View from "../base/View"
import { FileItem, useFileStore } from "../../store/Filestore"
import { getImageByFileType } from "../base/Sidebar"

interface Props {
    file: FileItem
}

const PictureViewer = ({ file }: Props) => {
    const { refreshFileURL, getFileById } = useFileStore()
    const [imageUrl, setImageUrl] = useState(file.thumbnail || file.url)
    const [retryCount, setRetryCount] = useState(0)
    const [error, setError] = useState(false)

    useEffect(() => {
        setImageUrl(file.thumbnail || file.url)
        setRetryCount(0)
        setError(false)
    }, [file.id, file.thumbnail, file.url])

    const handleError = async () => {
        // Try to refresh URL if it's a 403 or loading error
        if (retryCount < 2 && file.id) {
            try {
                await refreshFileURL(file.id)
                const updatedFile = getFileById(file.id)
                if (updatedFile?.url || updatedFile?.thumbnail) {
                    setImageUrl(updatedFile.thumbnail || updatedFile.url)
                    setRetryCount(prev => prev + 1)
                    setError(false)
                    return
                }
            } catch (err) {
                console.error("Failed to refresh file URL:", err)
            }
        }
        setError(true)
    }

    if (error || !imageUrl) {
        return (
            <View className="flex items-center justify-center h-full">
                <img
                    src={getImageByFileType(file.type)}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain opacity-50"
                />
            </View>
        )
    }

    return (
        <View className="flex items-center justify-center h-full">
            <img
                src={imageUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
                onError={handleError}
            />
        </View>
    )
}

export default PictureViewer
