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
}

const Avatar = (props: Props) => {
    const { current } = useTheme()

    return (
        <div className="relative flex-shrink-0">
            <div
                style={{
                    backgroundColor: current?.background
                }}
                className="h-9 w-9 sm:h-[5vh] sm:w-[5vh] min-h-[36px] min-w-[36px] overflow-hidden flex items-center justify-center rounded-full">
                {
                    props?.path != ""
                        ?
                        <img src={props?.path} alt="" className="h-full w-full object-cover" />
                        :
                        <Text className="uppercase font-semibold" value={props?.fallback?.text} />
                }
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