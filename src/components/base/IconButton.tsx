import { HTMLAttributes, ReactNode } from "react"
import { useTheme } from "../../store/Themestore"

export interface Props extends HTMLAttributes<HTMLButtonElement> {
    icon: ReactNode
    action: () => void
}

const IconButton = ({ icon, action, ...rest }: Props) => {

    const { current } = useTheme()

    return (
        <button
            style={{
                backgroundColor: current?.background
            }}
            className="h-[5vh] cursor-pointer w-[5vh] flex items-center rounded-lg justify-center" {...rest}>
            {icon}
        </button>
    )
}

export default IconButton