import { HTMLAttributes, ReactNode } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    icon: ReactNode
    action: () => void
    disabled?: boolean
}

const IconButton = ({ icon, action, onClick, ...rest }: Props) => {

    const { current } = useTheme()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (action) {
            action()
        }
        if (onClick) {
            onClick(e)
        }
    }

    return (
        <button
            onClick={handleClick}
            style={{
                backgroundColor: current?.background
            }}
            className="h-[5vh] cursor-pointer w-[5vh] flex items-center rounded-lg justify-center hover:opacity-80 transition-opacity" {...rest}>
            {icon}
        </button>
    )
}

export default IconButton