import { HTMLAttributes, ReactNode } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLDivElement> {

    mode?: "background" | "foreground" | ""
    children?: ReactNode
}

const View = ({ children, mode = "", ...rest }: Props) => {

    const { getBackgroundColor } = useTheme()

    return (
        <div {...rest} style={{ background: mode == "" ? "" : getBackgroundColor(mode) }}>
            {children}
        </div>
    )
}

export default View