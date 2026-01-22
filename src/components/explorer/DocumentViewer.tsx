import { useState, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { FileItem, useFileStore } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { formatFileSize } from "../../utils/storage"
import { FileText, Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import IconButton from "../base/IconButton"
import { Document, Page, pdfjs } from "react-pdf"
import DocViewer, { DocViewerRenderers } from "react-doc-viewer"
import { resolveFileUrl } from "../../utils/fileUrlResolver"

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

// Import PDF styles
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface Props {
    file: FileItem
}

const DocumentViewer = ({ file }: Props) => {
    const { current } = useTheme()
    const { refreshFileURL } = useFileStore()
    const [error, setError] = useState<string | null>(null)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.0)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    const getFileExtension = () => {
        return file.name.split('.').pop()?.toLowerCase() || ''
    }

    const extension = getFileExtension()
    const isPDF = extension === 'pdf'
    const isWord = ['doc', 'docx'].includes(extension)
    const isExcel = ['xls', 'xlsx'].includes(extension)
    const isPowerPoint = ['ppt', 'pptx'].includes(extension)
    const isOfficeDoc = isWord || isExcel || isPowerPoint

    const handleDownload = () => {
        if (file.url) {
            const link = document.createElement('a')
            link.href = file.url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
        setPageNumber(1)
    }

    const onDocumentLoadError = async (error: Error) => {
        console.error('Error loading PDF:', error)
        
        // If it's a 403 or network error, try refreshing the URL
        if (retryCount < 2 && (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('Failed to fetch'))) {
            try {
                await refreshFileURL(file.id)
                const updatedFile = useFileStore.getState().getFileById(file.id)
                if (updatedFile?.url) {
                    setFileUrl(updatedFile.url)
                    setRetryCount(prev => prev + 1)
                    setError(null)
                    return
                }
            } catch (err) {
                console.error("Failed to refresh file URL:", err)
            }
        }
        
        setError("Failed to load PDF document")
    }

    // Update fileUrl when file changes (resolves local file first)
    useEffect(() => {
        resolveFileUrl(file).then(url => {
            setFileUrl(url)
            setRetryCount(0)
            setError(null)
        }).catch(() => {
            // Fallback to server URL if resolution fails
            setFileUrl(file.url || null)
            setRetryCount(0)
            setError(null)
        })
    }, [file.url, file.id, file.deviceId])

    const goToPrevPage = () => {
        if (pageNumber > 1) {
            setPageNumber(pageNumber - 1)
        }
    }

    const goToNextPage = () => {
        if (numPages && pageNumber < numPages) {
            setPageNumber(pageNumber + 1)
        }
    }

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0))
    }

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5))
    }

    const renderViewer = () => {
        if (isPDF) {
            return (
                <View className="h-full w-full flex flex-col">
                    {error ? (
                        <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                            <Text value={error} className="opacity-60" />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: current?.primary,
                                    color: "white"
                                }}
                            >
                                <Download size={16} />
                                <span>Download Instead</span>
                            </button>
                        </View>
                    ) : (
                        <>
                            {/* PDF Controls */}
                            <View 
                                className="px-4 py-2 border-b flex items-center justify-between"
                                style={{ 
                                    borderColor: current?.dark + "10",
                                    backgroundColor: current?.foreground
                                }}
                            >
                                <View className="flex items-center gap-2">
                                    <IconButton
                                        icon={<ChevronLeft size={18} color={current?.dark} />}
                                        action={goToPrevPage}
                                        title="Previous page"
                                        disabled={pageNumber <= 1}
                                    />
                                    <Text 
                                        value={`Page ${pageNumber}${numPages ? ` of ${numPages}` : ''}`}
                                        size="sm"
                                        className="px-3"
                                    />
                                    <IconButton
                                        icon={<ChevronRight size={18} color={current?.dark} />}
                                        action={goToNextPage}
                                        title="Next page"
                                        disabled={!numPages || pageNumber >= numPages}
                                    />
                                </View>
                                <View className="flex items-center gap-2">
                                    <IconButton
                                        icon={<ZoomOut size={18} color={current?.dark} />}
                                        action={zoomOut}
                                        title="Zoom out"
                                        disabled={scale <= 0.5}
                                    />
                                    <Text 
                                        value={`${Math.round(scale * 100)}%`}
                                        size="sm"
                                        className="px-2 min-w-[50px] text-center"
                                    />
                                    <IconButton
                                        icon={<ZoomIn size={18} color={current?.dark} />}
                                        action={zoomIn}
                                        title="Zoom in"
                                        disabled={scale >= 3.0}
                                    />
                                </View>
                            </View>
                            
                            {/* PDF Viewer */}
                            <View className="flex-1 overflow-auto flex items-center justify-center p-4" style={{ backgroundColor: current?.background }}>
                                <Document
                                    file={fileUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    onLoadError={onDocumentLoadError}
                                    loading={
                                        <View className="flex items-center justify-center p-8">
                                            <Text value="Loading PDF..." className="opacity-60" />
                                        </View>
                                    }
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                    />
                                </Document>
                            </View>
                        </>
                    )}
                </View>
            )
        }

        if (isOfficeDoc) {
            const docs = [{ uri: fileUrl || '' }]
            
            return (
                <View className="h-full w-full flex flex-col">
                    <View className="flex-1 overflow-hidden">
                        <DocViewer
                            documents={docs}
                            pluginRenderers={DocViewerRenderers}
                            config={{
                                header: {
                                    disableHeader: false,
                                    disableFileName: false,
                                    retainURLParams: false
                                }
                            }}
                            style={{
                                height: '100%',
                                width: '100%'
                            }}
                        />
                    </View>
                </View>
            )
        }

        return (
            <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <FileText size={64} color={current?.primary} />
                <Text value={file.name} className="font-semibold text-lg" />
                <Text value={formatFileSize(file.size, file.sizeUnit)} size="sm" className="opacity-60" />
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{
                        backgroundColor: current?.primary,
                        color: "white"
                    }}
                >
                    <Download size={16} />
                    <span>Download</span>
                </button>
            </View>
        )
    }

    return (
        <View className="h-full flex flex-col" style={{ backgroundColor: current?.background }}>
            {/* Toolbar */}
            <View 
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ 
                    borderColor: current?.dark + "10",
                    backgroundColor: current?.foreground
                }}
            >
                <View className="flex items-center gap-3">
                    <FileText size={20} color={current?.primary} />
                    <Text value={file.name} className="font-medium" />
                </View>
                <View className="flex items-center gap-2">
                    <IconButton
                        icon={<Download size={18} color={current?.dark} />}
                        action={handleDownload}
                        title="Download"
                    />
                    {file.url && (
                        <IconButton
                            icon={<ExternalLink size={18} color={current?.dark} />}
                            action={() => window.open(file.url, '_blank')}
                            title="Open in new tab"
                        />
                    )}
                </View>
            </View>

            {/* Viewer */}
            <View className="flex-1 overflow-hidden">
                {renderViewer()}
            </View>
        </View>
    )
}

export default DocumentViewer
