import { SearchIcon, SlidersHorizontal } from "lucide-react"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useRef, useEffect, useState } from "react"
import { useFileStore } from "../../store/Filestore"
import { useLocation } from "react-router"
import { useAdminSearchStore } from "../../store/AdminSearchStore"
import { useAdminFilterStore } from "../../store/AdminFilterStore"
import { useSettingsSearchStore } from "../../store/SettingsSearchStore"

const getPlaceholder = (pathname: string): string => {
    if (pathname.startsWith('/settings')) return "Search settings..."
    if (pathname.includes('/admin/users')) return "Search users..."
    if (pathname.includes('/admin/analytics')) return "Search activities..."
    if (pathname.includes('/admin/activity')) return "Search activities..."
    if (pathname.includes('/admin/storage')) return "Search users..."
    if (pathname.includes('/admin/settings')) return "Search settings..."
    if (pathname.startsWith('/admin')) return "Search..."
    return "Search files..."
}

interface SearchProps {
    onFilterClick?: () => void
}

const Search = ({ onFilterClick }: SearchProps) => {
    const { current } = useTheme()
    const location = useLocation()
    const isAdminPage = location.pathname.startsWith('/admin')
    const isSettingsPage = location.pathname.startsWith('/settings')

    // Use appropriate store based on route
    const { setSearchQuery: setFileSearchQuery, searchQuery: fileSearchQuery, searchFilesBackend } = useFileStore()
    const { searchQuery: adminSearchQuery, setSearchQuery: setAdminSearchQuery } = useAdminSearchStore()
    const { searchQuery: settingsSearchQuery, setSearchQuery: setSettingsSearchQuery } = useSettingsSearchStore()
    const { activityType, userRole, userStatus, dateRange, analyticsType, storageRange } = useAdminFilterStore()

    // Use store value directly - Zustand will trigger re-renders
    const searchValue = isSettingsPage ? settingsSearchQuery : isAdminPage ? adminSearchQuery : fileSearchQuery
    const searchRef = useRef<HTMLInputElement>(null)
    const [isNarrow, setIsNarrow] = useState(typeof window !== "undefined" && window.innerWidth < 640)
    useEffect(() => {
        const handler = () => setIsNarrow(window.innerWidth < 640)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Check if any filters are active based on current page
    const hasActiveFilters = isAdminPage && (() => {
        if (location.pathname.includes('/admin/activity')) {
            return activityType !== "all"
        }
        if (location.pathname.includes('/admin/users')) {
            return userRole !== "all" || userStatus !== "all"
        }
        if (location.pathname.includes('/admin/analytics')) {
            return dateRange !== "all" || analyticsType !== "all"
        }
        if (location.pathname.includes('/admin/storage')) {
            return storageRange !== "all"
        }
        return false
    })()

    const handleChange = (value: string) => {
        if (isSettingsPage) {
            setSettingsSearchQuery(value)
        } else if (isAdminPage) {
            setAdminSearchQuery(value)
        } else {
            // Set query immediately - this will set isSearching: true
            setFileSearchQuery(value)

            // Debounce backend search
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }

            searchTimeoutRef.current = setTimeout(() => {
                if (value.trim()) {
                    searchFilesBackend(value.trim())
                } else {
                    searchFilesBackend("")
                }
            }, 500) // 500ms debounce
        }
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const fullPlaceholder = getPlaceholder(location.pathname)
    const placeholder = isNarrow && fullPlaceholder.length > 10 ? "Search…" : fullPlaceholder

    return (
        <View mode="background" className="rounded-full px-3 sm:px-6 py-2 sm:py-3 min-w-0 w-full max-w-full flex-1 md:flex-initial flex items-center gap-2 sm:gap-3 relative overflow-hidden">
            <SearchIcon size={18} color={`${current?.dark}70`} className="flex-shrink-0" />
            <input
                ref={searchRef}
                value={searchValue}
                onChange={(e) => handleChange(e.target.value)}
                className="outline-none flex-1 min-w-0 bg-transparent placeholder:opacity-60 overflow-hidden text-ellipsis"
                placeholder={placeholder}
                style={{
                    color: current?.dark,
                    fontSize: "14px",
                    letterSpacing: "0.01em"
                }}
            />
            {isAdminPage && onFilterClick && (
                <button
                    onClick={onFilterClick}
                    className="p-1.5 transition-all hover:opacity-80"
                    style={{
                        color: hasActiveFilters ? current?.primary : current?.dark,
                        backgroundColor: 'transparent',
                        borderRadius: '0.25rem'
                    }}
                    title="Open filters"
                >
                    <SlidersHorizontal size={18} />
                </button>
            )}
        </View>
    )
}

export default Search