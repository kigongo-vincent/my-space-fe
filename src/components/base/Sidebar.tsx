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

export interface Props extends HTMLAttributes<HTMLDivElement> {
}

export type fileType = "video" | "document" | "audio" | "note" | "url" | "picture" | "folder"

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

    const links: CategoryI[] = [
        {
            thumbNail: ComputerIcon,
            label: "My Computer"
        },
        {
            thumbNail: speakerIcon,
            label: "Audio"
        },
        {
            thumbNail: documentsIcon,
            label: "Documents"
        },
        {
            thumbNail: cameraIcon,
            label: "Videos"
        },
        {
            thumbNail: picturesIcon,
            label: "Pictures"
        },
        {
            thumbNail: othersIcon,
            label: "Others"
        },
        {
            thumbNail: notesIcon,
            label: "Notes"
        },
        {
            thumbNail: httpIcon,
            label: "URLs"
        }
    ]

    return (
        <View className={`p-4 flex flex-col justify-between ${className}`} mode='foreground'>
            <View className='grid grid-cols-2 gap-2'>
                {
                    links?.map((l, i) => <Category {...l} key={i} />)
                }

            </View>
            <Usage />
        </View>
    )
}

export default Sidebar