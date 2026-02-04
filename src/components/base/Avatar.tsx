import { useTheme } from "../../store/Themestore"
import Text from "./Text"

export interface Props {
    path?: string
    fallback: {
        text: string
        url?: string
    }
}

const Avatar = (props: Props) => {

    const { current } = useTheme()

    return (
        <div
            style={{
                backgroundColor: current?.background
            }}
            className="h-9 w-9 sm:h-[5vh] sm:w-[5vh] min-h-[36px] min-w-[36px] overflow-hidden flex items-center justify-center rounded-full flex-shrink-0">
            {
                props?.path != ""
                    ?
                    <img src={props?.path} alt="" className="h-full w-full object-cover" />
                    :
                    <Text className="uppercase font-semibold" value={props?.fallback?.text} />
            }
        </div>
    )
}

export default Avatar