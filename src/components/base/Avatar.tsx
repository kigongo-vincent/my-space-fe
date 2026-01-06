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
            className="h-[5vh] overflow-hidden flex items-center justify-center w-[5vh] rounded-full">
            {
                props?.path != ""
                    ?
                    <img src={props?.path} alt="" className="h-[5vh] w-[5vh] object-cover" />
                    :
                    <Text className="uppercase font-semibold" value={props?.fallback?.text} />
            }
        </div>
    )
}

export default Avatar