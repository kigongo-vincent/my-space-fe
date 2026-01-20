import { FileItem } from "../store/Filestore"
import { UsageI } from "../store/Userstore"
import { convertToGB, convertFileSizeToGB } from "./storage"

/**
 * Calculate how much storage needs to be freed (in GB) when downsizing
 */
export const calculateExcessStorage = (
    currentUsage: UsageI,
    newLimit: UsageI
): number => {
    const currentUsedGB = convertToGB(currentUsage.used, currentUsage.unit)
    const newLimitGB = convertToGB(newLimit.total, newLimit.unit)
    
    if (currentUsedGB <= newLimitGB) {
        return 0
    }
    
    return currentUsedGB - newLimitGB
}

/**
 * Get all files from all disks, sorted by size (largest first) and then by date (oldest first)
 * This helps identify which files should be deleted first
 */
export const getAllFilesSorted = (disks: { files: FileItem[] }[]): FileItem[] => {
    const allFiles: FileItem[] = []
    
    const collectFiles = (files: FileItem[]) => {
        files.forEach(file => {
            if (!file.isFolder && file.size && file.sizeUnit) {
                allFiles.push(file)
            }
            if (file.children) {
                collectFiles(file.children)
            }
        })
    }
    
    disks.forEach(disk => {
        collectFiles(disk.files)
    })
    
    // Sort by size (largest first), then by date (oldest first)
    return allFiles.sort((a, b) => {
        const sizeA = convertFileSizeToGB(a.size || 0, a.sizeUnit || "KB")
        const sizeB = convertFileSizeToGB(b.size || 0, b.sizeUnit || "KB")
        
        if (Math.abs(sizeA - sizeB) > 0.001) {
            return sizeB - sizeA // Largest first
        }
        
        // If sizes are similar, sort by date (oldest first)
        return a.createdAt.getTime() - b.createdAt.getTime()
    })
}

/**
 * Calculate which files should be suggested for deletion to meet the new storage limit
 * Returns files sorted by priority (largest/oldest first) that would free enough space
 */
export const getFilesToDelete = (
    disks: { files: FileItem[] }[],
    excessStorageGB: number
): FileItem[] => {
    if (excessStorageGB <= 0) {
        return []
    }
    
    const sortedFiles = getAllFilesSorted(disks)
    const filesToDelete: FileItem[] = []
    let freedSpaceGB = 0
    
    for (const file of sortedFiles) {
        if (freedSpaceGB >= excessStorageGB) {
            break
        }
        
        const fileSizeGB = convertFileSizeToGB(file.size || 0, file.sizeUnit || "KB")
        filesToDelete.push(file)
        freedSpaceGB += fileSizeGB
    }
    
    return filesToDelete
}

/**
 * Calculate total size of selected files in GB
 */
export const calculateSelectedFilesSize = (files: FileItem[]): number => {
    return files.reduce((total, file) => {
        if (!file.isFolder && file.size && file.sizeUnit) {
            return total + convertFileSizeToGB(file.size, file.sizeUnit)
        }
        return total
    }, 0)
}
