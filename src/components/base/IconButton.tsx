import { HTMLAttributes, ReactNode } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    icon: ReactNode
    action: () => void
    disabled?: boolean
    transparent?: boolean
}

const IconButton = ({ icon, action, onClick, transparent, ...rest }: Props) => {

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
                backgroundColor: transparent ? 'transparent' : current?.background
            }}
            className="h-9 w-9 sm:h-[5vh] sm:w-[5vh] min-h-[36px] min-w-[36px] cursor-pointer flex items-center rounded-lg justify-center hover:opacity-80 transition-opacity flex-shrink-0" {...rest}>
            {icon}
        </button>
    )
}

export default IconButton