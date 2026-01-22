import {
    FileText,
    Image,
    Music,
    Video,
    Link2,
    FileCode,
    FileJson,
    File,
    Folder,
    FileType,
    Code,
    Database,
    Archive,
    FileSpreadsheet,
    Presentation
} from "lucide-react"
import { fileType } from "../components/base/Sidebar"
import { ReactNode } from "react"

// Extended file type mapping
export type ExtendedFileType = fileType | "code" | "data" | "archive" | "spreadsheet" | "presentation"

// Map file extensions to file types
export const getFileTypeFromExtension = (extension: string): fileType => {
    const ext = extension.toLowerCase()

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext)) {
        return "picture"
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'].includes(ext)) {
        return "video"
    }

    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'].includes(ext)) {
        return "audio"
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext)) {
        return "document"
    }

    // Notes
    if (['md', 'markdown', 'note', 'txt'].includes(ext)) {
        return "note"
    }

    // URLs
    if (['url', 'link', 'webloc'].includes(ext)) {
        return "url"
    }

    // Default to others for unknown types
    return "others"
}

// Get icon component for file type
export const getFileIcon = (type: fileType, extension?: string, size: number = 20, color?: string): ReactNode => {
    const ext = extension?.toLowerCase() || ""
    const iconProps = { size, color: color || undefined }

    // Special handling for specific file types based on extension
    if (ext === 'json') {
        return <FileJson {...iconProps} />
    }
    if (['html', 'htm', 'xhtml'].includes(ext)) {
        return <FileCode {...iconProps} />
    }
    if (['css', 'scss', 'sass', 'less'].includes(ext)) {
        return <FileCode {...iconProps} />
    }
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext)) {
        return <Code {...iconProps} />
    }
    if (['xml', 'yaml', 'yml', 'toml'].includes(ext)) {
        return <FileCode {...iconProps} />
    }
    if (['csv', 'xlsx', 'xls', 'ods'].includes(ext)) {
        return <FileSpreadsheet {...iconProps} />
    }
    if (['pptx', 'ppt', 'odp'].includes(ext)) {
        return <Presentation {...iconProps} />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
        return <Archive {...iconProps} />
    }
    if (['sql', 'db', 'sqlite', 'sqlite3'].includes(ext)) {
        return <Database {...iconProps} />
    }
    if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)) {
        return <FileType {...iconProps} />
    }

    // Default icons based on file type
    switch (type) {
        case "picture":
            return <Image {...iconProps} />
        case "video":
            return <Video {...iconProps} />
        case "audio":
            return <Music {...iconProps} />
        case "document":
            return <FileText {...iconProps} />
        case "note":
            return <FileText {...iconProps} />
        case "url":
            return <Link2 {...iconProps} />
        case "folder":
            return <Folder {...iconProps} />
        case "others":
        default:
            return <File {...iconProps} />
    }
}

// Get icon color based on file type
export const getFileIconColor = (_type: fileType, extension?: string, theme?: { primary: string; dark: string }): string => {
    const ext = extension?.toLowerCase() || ""
    const primary = theme?.primary || "#EE7E06"

    // Special colors for code files
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'].includes(ext)) {
        return "#F7DF1E" // JavaScript yellow
    }
    if (ext === 'json') {
        return "#000000" // JSON black
    }
    if (['html', 'htm', 'xhtml'].includes(ext)) {
        return "#E34F26" // HTML orange-red
    }
    if (['css', 'scss', 'sass', 'less'].includes(ext)) {
        return "#1572B6" // CSS blue
    }
    if (['xml', 'yaml', 'yml'].includes(ext)) {
        return "#FF6600" // XML orange
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return "#FFA500" // Archive orange
    }

    // Default to primary color
    return primary
}
