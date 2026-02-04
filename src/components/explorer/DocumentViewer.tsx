import { useState, useEffect, useRef } from "react"
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
import mammoth from "mammoth"
import * as XLSX from "xlsx"
import parse from "pptx-parser"

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

// Import PDF styles
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface Props {
    file: FileItem
    hideToolbar?: boolean
}

const OFFICE_MIME_TYPES: Record<string, string> = {
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

const isBlobUrl = (url: string) => url.startsWith("blob:")

const PPTX_NOISE = /^(PX|NO_FILL|SOLID|DEGREE|PERCENTAGE|RENDERED|OUTER|DASH|SOLID_FILL|tint|INNER|CENTER|LEFT|RIGHT|TOP|BOTTOM)$/i
const PPTX_COLOR = /^rgba?\([^)]+\)$|^#[0-9a-fA-F]{3,8}$/
const PPTX_OBJECT = /^\[object \w+\]$/
const PPTX_NUMBER = /^-?\d+(\.\d+)?$/
const PPTX_SHAPE_NAME = /^(Subtitle|Rectangle|Title|Text|Picture|Chart|Table|Group|OleObject|Placeholder)\s+\d+$/i

function isRealText(s: string): boolean {
    if (!s || s.length < 2) return false
    if (PPTX_OBJECT.test(s)) return false
    if (PPTX_COLOR.test(s)) return false
    if (PPTX_NOISE.test(s)) return false
    if (PPTX_NUMBER.test(s)) return false
    if (PPTX_SHAPE_NAME.test(s.trim())) return false
    if (/^\d+\.\d+/.test(s)) return false
    return true
}

/** Recursively extract readable text from pptx-parser JSON, filtering specs and shape metadata */
function extractPptxTextSlides(pptJson: unknown): string[] {
    const slides: string[] = []
    const TEXT_KEYS = ["text", "t", "value", "content", "body"]
    const DESCEND_KEYS = ["content", "children", "shapes", "elements", "body", "paragraphs", "runs", "textRuns"]

    const collectText = (obj: unknown, slideSet: Set<string>): void => {
        if (obj == null) return
        if (typeof obj === "string") {
            const t = obj.trim()
            if (isRealText(t)) slideSet.add(t)
            return
        }
        if (Array.isArray(obj)) {
            obj.forEach(v => collectText(v, slideSet))
            return
        }
        if (typeof obj === "object") {
            const o = obj as Record<string, unknown>
            for (const [k, v] of Object.entries(o)) {
                if (TEXT_KEYS.includes(k) && typeof v === "string") {
                    const s = v.trim()
                    if (isRealText(s)) slideSet.add(s)
                } else if (DESCEND_KEYS.includes(k)) {
                    collectText(v, slideSet)
                } else if (Array.isArray(v) || (typeof v === "object" && v !== null)) {
                    collectText(v, slideSet)
                }
            }
        }
    }

    const data = pptJson as Record<string, unknown>
    const slideSources = data.slides ?? data.scenes ?? data.pages ?? [data]
    const arr = Array.isArray(slideSources) ? slideSources : [slideSources]

    for (const slide of arr) {
        const slideTexts = new Set<string>()
        collectText(slide, slideTexts)
        const text = [...slideTexts].filter(Boolean).join("\n\n")
        slides.push(text || "(Empty slide)")
    }
    return slides.length ? slides : ["(No slides found)"]
}

const DocumentViewer = ({ file, hideToolbar }: Props) => {
    const { current } = useTheme()
    const { refreshFileURL } = useFileStore()
    const [error, setError] = useState<string | null>(null)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.0)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [docxHtml, setDocxHtml] = useState<string | null>(null)
    const [docxError, setDocxError] = useState<string | null>(null)
    const [docxLoading, setDocxLoading] = useState(false)
    const [excelHtml, setExcelHtml] = useState<string | null>(null)
    const [excelError, setExcelError] = useState<string | null>(null)
    const [excelLoading, setExcelLoading] = useState(false)
    const [pptxSlides, setPptxSlides] = useState<string[]>([])
    const [pptxError, setPptxError] = useState<string | null>(null)
    const [pptxLoading, setPptxLoading] = useState(false)
    const [pptxSlideIndex, setPptxSlideIndex] = useState(0)
    const mountedRef = useRef(true)

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
        const href = fileUrl || file.url
        if (href) {
            const link = document.createElement('a')
            link.href = href
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
        mountedRef.current = true
        resolveFileUrl(file).then(url => {
            if (mountedRef.current) {
                setFileUrl(url)
                setRetryCount(0)
                setError(null)
                setDocxHtml(null)
                setDocxError(null)
                setExcelHtml(null)
                setExcelError(null)
                setPptxSlides([])
                setPptxError(null)
                setPptxSlideIndex(0)
            }
        }).catch(() => {
            if (mountedRef.current) {
                setFileUrl(file.url || null)
                setRetryCount(0)
                setError(null)
            }
        })
        return () => { mountedRef.current = false }
    }, [file.url, file.id, file.deviceId])

    // Render .docx from blob URL using mammoth (react-doc-viewer can't use blob URLs)
    useEffect(() => {
        if (!isWord || extension !== "docx" || !fileUrl || !isBlobUrl(fileUrl)) return

        setDocxLoading(true)
        setDocxError(null)
        setDocxHtml(null)

        fetch(fileUrl)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
            .then(result => {
                if (mountedRef.current) {
                    setDocxHtml(result.value)
                    setDocxError(result.messages.length ? result.messages[0].message : null)
                }
            })
            .catch(err => {
                if (mountedRef.current) {
                    setDocxError(err?.message || "Failed to load document")
                }
            })
            .finally(() => {
                if (mountedRef.current) setDocxLoading(false)
            })
    }, [fileUrl, extension, isWord])

    // Render Excel (xls, xlsx) from blob URL using SheetJS
    useEffect(() => {
        if (!isExcel || !fileUrl || !isBlobUrl(fileUrl)) return

        setExcelLoading(true)
        setExcelError(null)
        setExcelHtml(null)

        fetch(fileUrl)
            .then(res => res.arrayBuffer())
            .then(ab => {
                const wb = XLSX.read(ab)
                const htmlParts: string[] = []
                wb.SheetNames.forEach(name => {
                    const ws = wb.Sheets[name]
                    if (ws) {
                        htmlParts.push(`<h3 class="mb-3 font-semibold">${name}</h3>`)
                        htmlParts.push(XLSX.utils.sheet_to_html(ws))
                    }
                })
                return htmlParts.join("")
            })
            .then(html => {
                if (mountedRef.current) setExcelHtml(html)
            })
            .catch(err => {
                if (mountedRef.current) {
                    setExcelError(err?.message || "Failed to load spreadsheet")
                }
            })
            .finally(() => {
                if (mountedRef.current) setExcelLoading(false)
            })
    }, [fileUrl, isExcel])

    // Render .pptx from blob URL using pptx-parser
    useEffect(() => {
        if (!isPowerPoint || extension !== "pptx" || !fileUrl || !isBlobUrl(fileUrl)) return

        setPptxLoading(true)
        setPptxError(null)
        setPptxSlides([])
        setPptxSlideIndex(0)

        fetch(fileUrl)
            .then(res => res.blob())
            .then(blob => new File([blob], file.name))
            .then(async fileObj => {
                const pptJson = await parse(fileObj)
                const slides = extractPptxTextSlides(pptJson)
                if (mountedRef.current) setPptxSlides(slides)
            })
            .catch(err => {
                if (mountedRef.current) {
                    const msg = err?.message ?? "Failed to load presentation"
                    const friendly = (msg.includes("overrideClrMapping") || msg.includes("undefined"))
                        ? "This presentation format is not fully supported. Try downloading to view."
                        : msg
                    setPptxError(friendly)
                }
            })
            .finally(() => {
                if (mountedRef.current) setPptxLoading(false)
            })
    }, [fileUrl, extension, isPowerPoint, file.name])

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
                                className="px-2 sm:px-4 py-2 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                style={{ 
                                    borderColor: current?.dark + "10",
                                    backgroundColor: current?.foreground
                                }}
                            >
                                <View className="flex items-center gap-2 flex-wrap">
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
                            <View className="document-viewer-content flex-1 min-h-0 min-w-0 w-full overflow-auto flex items-center justify-center p-2 sm:p-4" style={{ backgroundColor: current?.background }}>
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
            const url = fileUrl || ''
            const isBlob = isBlobUrl(url)

            // .ppt (legacy): preview disabled, download only
            if (extension === "ppt") {
                return (
                    <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                        <FileText size={64} color={current?.primary} />
                        <Text value="Preview not available for .ppt files" className="opacity-60 text-center" />
                        <Text value={`Download to open ${file.name}`} size="sm" className="opacity-60" />
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                            style={{ backgroundColor: current?.primary, color: "white" }}
                        >
                            <Download size={16} />
                            <span>Download</span>
                        </button>
                    </View>
                )
            }

            // .docx from blob: use mammoth (react-doc-viewer can't fetch blob URLs)
            if (isWord && extension === "docx" && isBlob) {
                if (docxLoading) {
                    return (
                        <View className="flex-1 flex items-center justify-center">
                            <Text value="Loading document..." className="opacity-60" />
                        </View>
                    )
                }
                if (docxError) {
                    return (
                        <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                            <Text value={docxError} className="opacity-60 text-center" />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                                style={{ backgroundColor: current?.primary, color: "white" }}
                            >
                                <Download size={16} />
                                <span>Download Instead</span>
                            </button>
                        </View>
                    )
                }
                if (docxHtml) {
                    return (
                        <View className="document-viewer-content flex-1 min-h-0 overflow-auto p-4 sm:p-6" style={{ backgroundColor: current?.background }}>
                            <div
                                className="docx-content max-w-3xl w-full mx-auto text-left"
                                style={{
                                    color: current?.dark,
                                    fontSize: "15px",
                                    lineHeight: 1.7,
                                    fontFamily: "Georgia, 'Times New Roman', serif",
                                }}
                                dangerouslySetInnerHTML={{ __html: docxHtml }}
                            />
                        </View>
                    )
                }
                return null
            }

            // Excel (xls, xlsx) from blob: use SheetJS
            if (isExcel && isBlob) {
                if (excelLoading) {
                    return (
                        <View className="flex-1 flex items-center justify-center">
                            <Text value="Loading spreadsheet..." className="opacity-60" />
                        </View>
                    )
                }
                if (excelError) {
                    return (
                        <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                            <Text value={excelError} className="opacity-60 text-center" />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                                style={{ backgroundColor: current?.primary, color: "white" }}
                            >
                                <Download size={16} />
                                <span>Download Instead</span>
                            </button>
                        </View>
                    )
                }
                if (excelHtml) {
                    return (
                        <View className="document-viewer-content flex-1 min-h-0 overflow-auto p-4 sm:p-6 overflow-x-auto" style={{ backgroundColor: current?.background }}>
                            <div
                                className="excel-content max-w-full [&_table]:border-collapse [&_table]:w-full [&_table]:min-w-max [&_table]:shadow-sm [&_th]:border [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:px-2 [&_td]:py-2"
                                style={{
                                    color: current?.dark,
                                    fontSize: "14px",
                                    fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                                }}
                                dangerouslySetInnerHTML={{ __html: excelHtml }}
                            />
                        </View>
                    )
                }
                return null
            }

            // PowerPoint (pptx) from blob: use pptx-parser
            if (isPowerPoint && extension === "pptx" && isBlob) {
                if (pptxLoading) {
                    return (
                        <View className="flex-1 flex items-center justify-center">
                            <Text value="Loading presentation..." className="opacity-60" />
                        </View>
                    )
                }
                if (pptxError) {
                    return (
                        <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                            <Text value={pptxError} className="opacity-60 text-center" />
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                                style={{ backgroundColor: current?.primary, color: "white" }}
                            >
                                <Download size={16} />
                                <span>Download Instead</span>
                            </button>
                        </View>
                    )
                }
                if (pptxSlides.length > 0) {
                    const curr = pptxSlides[pptxSlideIndex]
                    return (
                        <View className="flex-1 min-h-0 flex flex-col">
                            <View
                                className="px-4 py-2 border-b flex items-center justify-between shrink-0"
                                style={{ borderColor: current?.dark + "10", backgroundColor: current?.foreground }}
                            >
                                <View className="flex items-center gap-2">
                                    <IconButton
                                        icon={<ChevronLeft size={18} color={current?.dark} />}
                                        action={() => setPptxSlideIndex(i => Math.max(0, i - 1))}
                                        title="Previous slide"
                                        disabled={pptxSlideIndex <= 0}
                                    />
                                    <Text
                                        value={`Slide ${pptxSlideIndex + 1} of ${pptxSlides.length}`}
                                        size="sm"
                                        className="px-3"
                                    />
                                    <IconButton
                                        icon={<ChevronRight size={18} color={current?.dark} />}
                                        action={() => setPptxSlideIndex(i => Math.min(pptxSlides.length - 1, i + 1))}
                                        title="Next slide"
                                        disabled={pptxSlideIndex >= pptxSlides.length - 1}
                                    />
                                </View>
                            </View>
                            <View
                                className="document-viewer-content flex-1 min-h-0 overflow-auto p-8 flex items-center justify-center"
                                style={{ backgroundColor: current?.background }}
                            >
                                <div
                                    className="pptx-slide max-w-2xl w-full text-left whitespace-pre-wrap rounded-lg border p-8 shadow-sm"
                                    style={{
                                        color: current?.dark,
                                        fontSize: "18px",
                                        lineHeight: 1.6,
                                        fontFamily: "system-ui, -apple-system, sans-serif",
                                        backgroundColor: current?.foreground,
                                        borderColor: current?.dark + "15",
                                    }}
                                >
                                    {curr}
                                </div>
                            </View>
                        </View>
                    )
                }
                return null
            }

            // doc, ppt (legacy) from blob: no client-side parser, show download
            if (isBlob) {
                return (
                    <View className="flex flex-col items-center justify-center h-full gap-4 p-8">
                        <FileText size={64} color={current?.primary} />
                        <Text value="Preview not available for local files" className="opacity-60 text-center" />
                        <Text value={`Use download to open ${file.name}`} size="sm" className="opacity-60" />
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                            style={{ backgroundColor: current?.primary, color: "white" }}
                        >
                            <Download size={16} />
                            <span>Download</span>
                        </button>
                    </View>
                )
            }

            // Server URL: use react-doc-viewer with fileType to skip HEAD request
            if (!url) {
                return (
                    <View className="flex-1 flex items-center justify-center">
                        <Text value="Loading..." className="opacity-60" />
                    </View>
                )
            }

            const mimeType = OFFICE_MIME_TYPES[extension]
            const docs = [{ uri: url, fileType: mimeType }]

            return (
                <View className="h-full w-full flex flex-col min-h-0">
                    <View className="flex-1 min-h-0 overflow-hidden">
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
            {/* Toolbar - hidden in presentation mode */}
            {!hideToolbar && (
                <View 
                    className="px-4 py-3 border-b flex items-center justify-between shrink-0"
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
            )}

            {/* Viewer */}
            <View className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {renderViewer()}
            </View>
        </View>
    )
}

export default DocumentViewer
