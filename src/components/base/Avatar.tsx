import { useState, useEffect } from "react"
import { useTheme } from "../../store/Themestore"
import Text from "./Text"
import { Shield } from "lucide-react"

export interface Props {
    path?: string
    fallback: {
        text: string
        url?: string
    }
    badge?: "admin"
    /** Custom background color for fallback avatar */
    backgroundColor?: string
    /** Custom text color for fallback avatar */
    textColor?: string
}

const Avatar = (props: Props) => {
    const { current } = useTheme()
    const [imageError, setImageError] = useState(false)

    // Reset error state when path changes
    useEffect(() => {
        setImageError(false)
    }, [props.path])

    const hasValidImage = props?.path && props.path !== "" && !imageError

    const handleImageError = () => {
        setImageError(true)
    }

    const bgColor = props.backgroundColor || current?.background
    const txtColor = props.textColor || current?.dark

    return (
        <div className="relative flex-shrink-0">
            <div
                style={{
                    backgroundColor: bgColor
                }}
                className="h-9 w-9 sm:h-[5vh] sm:w-[5vh] min-h-[36px] min-w-[36px] overflow-hidden flex items-center justify-center rounded-full">
                {hasValidImage ? (
                    <img 
                        src={props.path} 
                        alt="" 
                        className="h-full w-full object-cover" 
                        onError={handleImageError}
                    />
                ) : (
                    <Text className="uppercase font-semibold" value={props?.fallback?.text} style={{ color: txtColor }} />
                )}
            </div>
            {props.badge === "admin" && (
                <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full"
                    style={{
                        backgroundColor: current?.primary,
                        color: "white"
                    }}
                    title="Admin"
                >
                    <Shield size={10} fill="currentColor" strokeWidth={0} />
                </span>
            )}
        </div>
    )
}

export default Avatar