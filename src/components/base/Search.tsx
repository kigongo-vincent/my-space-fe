import { SearchIcon } from "lucide-react"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useState } from "react"

const Search = () => {

    const { current } = useTheme()
    const [search, setSearch] = useState("")

    const handleChange = (value: string) => {
        setSearch(value)
    }

    return (
        <View mode="background" className="rounded-full px-6 py-3 min-w-[25vw] flex items-center gap-2">
            <SearchIcon size={17} color={`${current?.dark}80`} />
            <input value={search} onChange={(e) => handleChange(e.target.value)} className="outline-none" placeholder="search..." style={{ color: `${current?.dark}80` }} />
        </View>
    )
}

export default Search