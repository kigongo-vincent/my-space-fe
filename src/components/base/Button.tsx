import { HTMLAttributes } from "react"
import { useTheme } from "../../store/Themestore"
import { Loader2 } from "lucide-react"

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    title: string
    action: () => void
    loading?: boolean
    color?: "primary"
    disabled?: boolean
}

const Button = ({ title, action, color = "primary", loading = false, disabled = false, children, className, ...rest }: Props) => {

    const { current } = useTheme()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!loading && !disabled && action) {
            action()
        }
    }

    return (
        <button
            type="button"
            style={{
                backgroundColor: color == "primary" ? current?.primary : "",
                color: color == "primary" ? "white" : "",
                fontSize: "13px",
                opacity: (loading || disabled) ? 0.6 : 1,
                cursor: (loading || disabled) ? "not-allowed" : "pointer"
            }}
            onClick={handleClick}
            disabled={loading || disabled}
            className={`flex items-center p-2.5 rounded-md justify-center gap-2 h-10 ${className}`}
            {...rest}
        >
            {loading ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                title
            )}
        </button>
    )
}

export default Button