import { SearchIcon, Globe } from "lucide-react"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useState, useRef, useEffect } from "react"
import { useFileStore } from "../../store/Filestore"

const Search = () => {
    const { current } = useTheme()
    const [search, setSearch] = useState("")
    const [showOnlineOption, setShowOnlineOption] = useState(false)
    const { setSearchQuery, searchFiles } = useFileStore()
    const searchRef = useRef<HTMLInputElement>(null)

    const handleChange = (value: string) => {
        setSearch(value)
        setSearchQuery(value)
        setShowOnlineOption(value.trim().length > 0)
    }

    const handleSearchOnline = () => {
        if (search.trim()) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(search.trim())}`
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
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && search.trim()) {
                e.preventDefault()
                handleSearchOnline()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [search])

    return (
        <View mode="background" className="rounded-full px-6 py-3 min-w-[25vw] flex items-center gap-3 relative">
            <SearchIcon size={18} color={`${current?.dark}70`} />
            <input 
                ref={searchRef}
                value={search} 
                onChange={(e) => handleChange(e.target.value)} 
                className="outline-none flex-1 placeholder:opacity-60" 
                placeholder="Search files..." 
                style={{ 
                    color: current?.dark, 
                    backgroundColor: "transparent",
                    fontSize: "14px",
                    letterSpacing: "0.01em"
                }} 
            />
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