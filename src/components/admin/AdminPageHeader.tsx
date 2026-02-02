import View from "../base/View"
import Text from "../base/Text"

interface AdminPageHeaderProps {
    title: string
    subtitle?: string
}

/**
 * Page header: heading slightly bigger than base, clear hierarchy.
 * - Title: 1rem (slightly bigger than base 0.89rem), uppercase, tracking
 * - Subtitle: base size, opacity-70 for contrast
 */
const AdminPageHeader = ({ title, subtitle }: AdminPageHeaderProps) => {
    return (
        <View className="mb-6">
            <Text
                value={title}
                className="uppercase tracking-wider font-medium mb-1"
                style={{ letterSpacing: "0.1em", fontSize: "var(--admin-heading-font, 1rem)", opacity: 0.9 }}
            />
            {subtitle && (
                <Text
                    value={subtitle}
                    className="mt-0.5 opacity-70"
                    style={{ fontSize: "var(--admin-base-font, 0.89rem)" }}
                />
            )}
        </View>
    )
}

export default AdminPageHeader
