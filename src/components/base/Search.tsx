import { SearchIcon, Globe, SlidersHorizontal } from "lucide-react"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useState, useRef, useEffect } from "react"
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
    const { setSearchQuery: setFileSearchQuery, searchQuery: fileSearchQuery } = useFileStore()
    const { searchQuery: adminSearchQuery, setSearchQuery: setAdminSearchQuery } = useAdminSearchStore()
    const { activityType, userRole, userStatus, dateRange, analyticsType, storageRange } = useAdminFilterStore()
    
    // Use store value directly - Zustand will trigger re-renders
    const searchValue = isAdminPage ? adminSearchQuery : fileSearchQuery
    const [showOnlineOption, setShowOnlineOption] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)
    
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

    // Update showOnlineOption when search changes
    useEffect(() => {
        setShowOnlineOption(searchValue.trim().length > 0 && !isAdminPage)
    }, [searchValue, isAdminPage])

    const handleChange = (value: string) => {
        if (isAdminPage) {
            setAdminSearchQuery(value)
        } else {
            setFileSearchQuery(value)
        }
    }

    const handleSearchOnline = () => {
        if (searchValue.trim()) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchValue.trim())}`
            window.open(searchUrl, '_blank', 'noopener,noreferrer')
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                searchRef.current?.focus()
            }
            // Ctrl/Cmd + Enter to search online
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && searchValue.trim()) {
                e.preventDefault()
                handleSearchOnline()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [searchValue])

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
            {showOnlineOption && (
                <button
                    onClick={handleSearchOnline}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:opacity-80 text-xs font-medium"
                    style={{
                        backgroundColor: current?.primary + "15",
                        color: current?.primary
                    }}
                    title="Search online (Ctrl/Cmd + Enter)"
                >
                    <Globe size={14} />
                    <span>Online</span>
                </button>
            )}
        </View>
    )
}

export default Search