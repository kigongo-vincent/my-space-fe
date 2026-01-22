import { HTMLAttributes, ReactNode, forwardRef } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLDivElement> {

    mode?: "background" | "foreground" | ""
    children?: ReactNode
}

const View = forwardRef<HTMLDivElement, Props>(({ children, mode = "", style, className, onContextMenu, ...rest }, ref) => {

    const { getBackgroundColor } = useTheme()

    // Handle context menu - if onContextMenu is provided, it will handle prevention
    // Otherwise, we prevent default for file-explorer-container to block browser menu
    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        // If a handler is provided, let it handle everything
        if (onContextMenu) {
            onContextMenu(e)
        } else if (className?.includes('file-explorer-container')) {
            // Only prevent default if no handler is provided
            e.preventDefault()
            e.stopPropagation()
        }
    }

    return (
        <div 
            ref={ref}
            {...rest}
            className={className}
            style={{ background: mode == "" ? "" : getBackgroundColor(mode), ...style }}
            onContextMenu={handleContextMenu}
        >
            {children}
        </div>
    )
})

View.displayName = "View"

export default View