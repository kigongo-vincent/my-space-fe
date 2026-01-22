import { HTMLAttributes } from 'react'
import View from './View'
import Category, { CategoryI } from '../sidebar/Category'
import ComputerIcon from "../../assets/categories/computer.webp"
import cameraIcon from "../../assets/categories/camera.webp"
import documentsIcon from "../../assets/categories/documents.webp"
import httpIcon from "../../assets/categories/http.webp"
import notesIcon from "../../assets/categories/notes.webp"
import speakerIcon from "../../assets/categories/speaker.webp"
import othersIcon from "../../assets/categories/others.webp"
import picturesIcon from "../../assets/categories/pictures.webp"
import folderIcon from "../../assets/categories/folder.webp"
import Usage from '../sidebar/Usage'
import { useFileStore } from '../../store/Filestore'

export interface Props extends HTMLAttributes<HTMLDivElement> {
}

export type fileType = "video" | "document" | "audio" | "note" | "url" | "picture" | "folder" | "others"

export const getImageByFileType = (type: fileType): string => {
    switch (type) {
        case "audio":
            return speakerIcon
        case "document":
            return documentsIcon
        case "note":
            return notesIcon
        case "picture":
            return picturesIcon
        case "folder":
            return folderIcon
        case "video":
            return cameraIcon
        default:
            return folderIcon
    }
}

const Sidebar = ({ className }: Props) => {
    const { setCurrentDisk, disks, setFilterByType, filterByType } = useFileStore()

    const links: CategoryI[] = [
        {
            thumbNail: ComputerIcon,
            label: "My Computer",
            action: async () => {
                await setFilterByType(null)
                setCurrentDisk(null)
            }
        },
        {
            thumbNail: speakerIcon,
            label: "Audio",
            action: async () => {
                await setFilterByType("audio")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: documentsIcon,
            label: "Documents",
            action: async () => {
                await setFilterByType("document")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: cameraIcon,
            label: "Videos",
            action: async () => {
                await setFilterByType("video")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: picturesIcon,
            label: "Pictures",
            action: async () => {
                await setFilterByType("picture")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: othersIcon,
            label: "Others",
            action: async () => {
                await setFilterByType("others")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: notesIcon,
            label: "Notes",
            action: async () => {
                await setFilterByType("note")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        },
        {
            thumbNail: httpIcon,
            label: "URLs",
            action: async () => {
                await setFilterByType("url")
                if (disks.length > 0) {
                    setCurrentDisk(disks[0]?.id || null)
                }
            }
        }
    ]

    return (
        <View className={`p-4 flex flex-col justify-between ${className}`} mode='foreground'>
            <View className='grid grid-cols-2 gap-2'>
                {
                    links?.map((l, i) => {
                        const isActive = 
                            (l.label === "My Computer" && filterByType === null) ||
                            (l.label === "Audio" && filterByType === "audio") ||
                            (l.label === "Documents" && filterByType === "document") ||
                            (l.label === "Videos" && filterByType === "video") ||
                            (l.label === "Pictures" && filterByType === "picture") ||
                            (l.label === "Others" && filterByType === "others") ||
                            (l.label === "Notes" && filterByType === "note") ||
                            (l.label === "URLs" && filterByType === "url")
                        return <Category {...l} key={i} isActive={isActive} />
                    })
                }

            </View>
            <Usage />
        </View>
    )
}

export default Sidebar