import View from "../base/View"
import Text from "../base/Text"
import IconButton from "../base/IconButton"
import { Grid, List, Settings } from "lucide-react"
import { useTheme } from "../../store/Themestore"
import { useFileStore } from "../../store/Filestore"

const ViewSettingsBar = () => {
    const { current } = useTheme()
    const { viewMode, setViewMode } = useFileStore()

    return (
        <View
            className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5 border-b"
            mode="background"
            style={{
                borderColor: current?.dark + "20",
                minHeight: "52px"
            }}
        >
            <View className="flex items-center gap-2">
                <Settings size={16} color={current?.dark} style={{ opacity: 0.6 }} />
                <Text
                    value="View Settings"
                    className="text-sm font-medium opacity-70"
                    style={{ letterSpacing: "0.02em" }}
                />
            </View>

            <View className="flex items-center gap-1" mode="background">
                <IconButton
                    icon={<Grid size={18} color={viewMode === "grid" ? current?.primary : current?.dark} />}
                    action={() => setViewMode("grid")}
                    title="Grid View"
                />
                <IconButton
                    icon={<List size={18} color={viewMode === "list" ? current?.primary : current?.dark} />}
                    action={() => setViewMode("list")}
                    title="List View"
                />
            </View>
        </View>
    )
}

export default ViewSettingsBar
