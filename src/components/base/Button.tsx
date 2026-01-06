import { HTMLAttributes } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    title: string
    action: () => void
    loading?: boolean
    color?: "primary"
}

const Button = ({ title, action, color = "primary", children, className, ...rest }: Props) => {

    const { current } = useTheme()

    return (
        <button
            style={{
                backgroundColor: color == "primary" ? current?.primary : "",
                color: color == "primary" ? "white" : ""
            }}
            onClick={action} className={`flex items-center font-medium p-3 rounded-lg  justify-center gap-2 ${className}`} {...rest}>
            {title}
        </button>
    )
}

export default Button