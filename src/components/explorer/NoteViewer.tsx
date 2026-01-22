import { useState, useEffect, useRef } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { FileItem } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { Edit2, Save, X } from "lucide-react"
import IconButton from "../base/IconButton"
import { useFileStore } from "../../store/Filestore"

interface Props {
    file: FileItem
}

const NoteViewer = ({ file }: Props) => {
    const { current } = useTheme()
    const { renameFile, updateNoteContent } = useFileStore()
    const [isEditing, setIsEditing] = useState(false)
    const [noteTitle, setNoteTitle] = useState(file.name.replace('.md', ''))
    const [noteContent, setNoteContent] = useState(file.url || "") // Store content in url field
    const [originalTitle, setOriginalTitle] = useState(file.name.replace('.md', ''))
    const [originalContent, setOriginalContent] = useState(file.url || "")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            // Move cursor to end
            const len = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(len, len)
        }
    }, [isEditing])

    const handleSave = () => {
        if (noteTitle.trim()) {
            renameFile(file.id, noteTitle.trim() + '.md')
            if (updateNoteContent) {
                updateNoteContent(file.id, noteContent)
            }
            setIsEditing(false)
            setOriginalTitle(noteTitle)
            setOriginalContent(noteContent)
        }
    }

    const handleCancel = () => {
        setNoteTitle(originalTitle)
        setNoteContent(originalContent)
        setIsEditing(false)
    }

    // Simple markdown rendering
    const renderMarkdown = (text: string) => {
        if (!text) return null
        
        const lines = text.split('\n')
        return lines.map((line, index) => {
            // Headers
            if (line.startsWith('# ')) {
                return (
                    <h1 key={index} className="text-2xl font-bold mb-4 mt-6 first:mt-0" style={{ color: current?.dark }}>
                        {line.substring(2)}
                    </h1>
                )
            }
            if (line.startsWith('## ')) {
                return (
                    <h2 key={index} className="text-xl font-semibold mb-3 mt-5 first:mt-0" style={{ color: current?.dark }}>
                        {line.substring(3)}
                    </h2>
                )
            }
            if (line.startsWith('### ')) {
                return (
                    <h3 key={index} className="text-lg font-medium mb-2 mt-4 first:mt-0" style={{ color: current?.dark }}>
                        {line.substring(4)}
                    </h3>
                )
            }
            
            // Bold
            let processedLine = line
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Empty line
            if (line.trim() === '') {
                return <div key={index} className="h-4" />
            }
            
            return (
                <p 
                    key={index} 
                    className="mb-3 leading-relaxed"
                    style={{ color: current?.dark }}
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                />
            )
        })
    }

    return (
        <View className="h-full flex flex-col" style={{ backgroundColor: current?.background }}>
            {/* Header - Apple Notes style */}
            <View 
                className="px-8 py-4 border-b flex items-center justify-between"
                style={{ 
                    borderColor: current?.dark + "10",
                    backgroundColor: current?.foreground
                }}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="flex-1 outline-none font-semibold text-lg"
                        style={{
                            backgroundColor: "transparent",
                            color: current?.dark
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleSave()
                            }
                            if (e.key === "Escape") {
                                handleCancel()
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <Text 
                        value={noteTitle} 
                        className="font-semibold text-lg flex-1"
                        style={{ color: current?.dark }}
                    />
                )}
                
                <View className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <IconButton
                                icon={<Save size={18} color={current?.primary} />}
                                action={handleSave}
                                title="Save"
                            />
                            <IconButton
                                icon={<X size={18} color={current?.dark} />}
                                action={handleCancel}
                                title="Cancel"
                            />
                        </>
                    ) : (
                        <IconButton
                            icon={<Edit2 size={18} color={current?.dark} />}
                            action={() => setIsEditing(true)}
                            title="Edit"
                        />
                    )}
                </View>
            </View>

            {/* Content Area - Apple Notes style */}
            <View className="flex-1 overflow-auto">
                {isEditing ? (
                    <View className="h-full p-8">
                        <textarea
                            ref={textareaRef}
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full h-full outline-none resize-none"
                            style={{
                                backgroundColor: "transparent",
                                color: current?.dark,
                                fontSize: "16px",
                                lineHeight: "1.6",
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }}
                            placeholder="Start writing..."
                        />
                    </View>
                ) : (
                    <View className="p-8 max-w-3xl mx-auto">
                        <div 
                            className="prose prose-sm max-w-none"
                            style={{
                                color: current?.dark,
                                fontSize: "16px",
                                lineHeight: "1.6",
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }}
                        >
                            {noteContent ? renderMarkdown(noteContent) : (
                                <Text value="Empty note" className="opacity-40 italic" />
                            )}
                        </div>
                    </View>
                )}
            </View>
        </View>
    )
}

export default NoteViewer
