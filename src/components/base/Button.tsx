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
                color: color == "primary" ? "white" : "",
                fontSize: "13px"
            }}
            onClick={action} className={`flex items-center p-2.5 rounded-md justify-center gap-2 h-10 ${className}`} {...rest}>
            {title}
        </button>
    )
}

export default Button