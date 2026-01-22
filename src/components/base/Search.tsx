import { SearchIcon, SlidersHorizontal } from "lucide-react"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useRef, useEffect } from "react"
import { useFileStore } from "../../store/Filestore"
import { useLocation } from "react-router"
import { useAdminSearchStore } from "../../store/AdminSearchStore"
import { useAdminFilterStore } from "../../store/AdminFilterStore"

const getAdminPlaceholder = (pathname: string): string => {
    if (pathname.includes('/admin/users')) return "Search users..."
    if (pathname.includes('/admin/analytics')) return "Search activities..."
    if (pathname.includes('/admin/activity')) return "Search activities..."
    if (pathname.includes('/admin/storage')) return "Search users..."
    if (pathname.includes('/admin/settings')) return "Search settings..."
    return "Search..."
}

interface SearchProps {
    onFilterClick?: () => void
}

const Search = ({ onFilterClick }: SearchProps) => {
    const { current } = useTheme()
    const location = useLocation()
    const isAdminPage = location.pathname.startsWith('/admin')
    
    // Use appropriate store based on route
    const { setSearchQuery: setFileSearchQuery, searchQuery: fileSearchQuery, searchFilesBackend } = useFileStore()
    const { searchQuery: adminSearchQuery, setSearchQuery: setAdminSearchQuery } = useAdminSearchStore()
    const { activityType, userRole, userStatus, dateRange, analyticsType, storageRange } = useAdminFilterStore()
    
    // Use store value directly - Zustand will trigger re-renders
    const searchValue = isAdminPage ? adminSearchQuery : fileSearchQuery
    const searchRef = useRef<HTMLInputElement>(null)
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
        if (isAdminPage) {
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

    return (
        <View mode="background" className="rounded-full px-6 py-3 min-w-[25vw] flex items-center gap-3 relative">
            <SearchIcon size={18} color={`${current?.dark}70`} />
            <input 
                ref={searchRef}
                value={searchValue} 
                onChange={(e) => handleChange(e.target.value)} 
                className="outline-none flex-1 placeholder:opacity-60" 
                placeholder={isAdminPage ? getAdminPlaceholder(location.pathname) : "Search files..."} 
                style={{ 
                    color: current?.dark, 
                    backgroundColor: "transparent",
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