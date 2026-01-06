import { useLocation } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import computerIcon from "../../assets/categories/computer.webp"
import { useState } from "react"
import Disk, { DiskI } from "../../components/home/Disk"
import Node, { RecentlyOpenedI } from "../../components/base/Node"



const Index = () => {

    const { pathname } = useLocation()

    const [disks, setDisks] = useState<DiskI[]>([
        {
            id: 1,
            label: "Personal stuff",
            usage: {
                unit: "TB",
                total: 1,
                used: .3
            }
        },
        {
            id: 1,
            label: "Personal stuff",
            usage: {
                unit: "GB",
                total: 100,
                used: 45
            }
        },
    ])

    const [recentlyOpened, setRecentlyOpened] = useState<RecentlyOpenedI[]>([
        {
            label: "pop music album 2023.mp3",
            fileType: "audio",
            path: ""
        },
        {
            label: "Downloads",
            fileType: "folder",
            path: ""
        },
    ])

    const [pinned, setPinned] = useState<RecentlyOpenedI[]>([

        {
            label: "Cases (255) internal audit from the....",
            fileType: "folder",
            path: ""
        },
    ])

    return (
        <View className=" h-full flex flex-col p-2">
            <View className="flex-1 gap-8 flex flex-col">

                {/* disks  */}
                <View>
                    <Text value={"Availabe drives"} className="mb-5 opacity-40" />
                    <View className="grid gap-2 grid-cols-2">
                        {
                            disks?.map((d, i) => <Disk {...d} key={i} />)
                        }

                    </View>
                </View>

                {/* recent  */}
                <View>
                    <Text value={"Recently opened"} className="mb-5 opacity-40" />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            recentlyOpened?.map((r, i) => <Node {...r} key={i} />)
                        }

                    </View>
                </View>

                {/* pinned */}
                <View>
                    <Text value={"Pinned"} className="mb-5 opacity-40" />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            pinned?.map((r, i) => <Node {...r} pinned key={i} />)
                        }
                    </View>
                </View>

            </View>
            <View className="border-t flex items-center gap-2 border-t-gray-200 h-14">
                <img src={computerIcon} height={20} width={20} alt="" />
                <Text value={pathname} />
            </View>
        </View>
    )
}

export default Index