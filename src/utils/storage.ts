import { Disk } from "../store/Filestore"
import { UsageI } from "../store/Userstore"

/**
 * Convert storage size to a consistent unit (GB)
 */
export const convertToGB = (size: number, unit: "KB" | "MB" | "GB" | "TB" | "PB"): number => {
    switch (unit) {
        case "KB":
            return size / (1024 * 1024)
        case "MB":
            return size / 1024
        case "GB":
            return size
        case "TB":
            return size * 1024
        case "PB":
            return size * 1024 * 1024
        default:
            return size
    }
}

/**
 * Format storage value to 2 decimal places
 */
export const formatStorage = (value: number, unit: string): string => {
    return `${value.toFixed(2)} ${unit}`
}

/**
 * Format file size to 2 decimal places
 */
export const formatFileSize = (size: number | undefined, sizeUnit: string | undefined): string => {
    if (!size || !sizeUnit) return "0 KB"
    return `${size.toFixed(2)} ${sizeUnit}`
}

/**
 * Calculate total storage usage from all disks
 */
export const calculateTotalStorage = (disks: Disk[]): UsageI => {
    let totalUsedGB = 0
    let totalCapacityGB = 0
    let maxUnit: "GB" | "MB" | "TB" | "PB" = "GB"

    disks.forEach(disk => {
        const diskUsedGB = convertToGB(disk.usage.used, disk.usage.unit)
        const diskTotalGB = convertToGB(disk.usage.total, disk.usage.unit)
        
        totalUsedGB += diskUsedGB
        totalCapacityGB += diskTotalGB

        // Determine the largest unit used
        if (disk.usage.unit === "TB" || disk.usage.unit === "PB") {
            maxUnit = disk.usage.unit
        } else if (disk.usage.unit === "GB" && maxUnit === "GB") {
            maxUnit = "GB"
        }
    })

    // Convert back to the appropriate unit for display
    let displayUsed = totalUsedGB
    let displayTotal = totalCapacityGB
    let displayUnit: "GB" | "MB" | "TB" | "PB" = "GB"

    // If total is less than 1 GB, use MB
    if (totalCapacityGB < 1) {
        displayUnit = "MB"
        displayUsed = totalUsedGB * 1024
        displayTotal = totalCapacityGB * 1024
    } else if (totalCapacityGB >= 1024) {
        // If total is >= 1 TB, use TB
        displayUnit = "TB"
        displayUsed = totalUsedGB / 1024
        displayTotal = totalCapacityGB / 1024
    }

    return {
        used: parseFloat(displayUsed.toFixed(2)),
        total: parseFloat(displayTotal.toFixed(2)),
        unit: displayUnit
    }
}

/**
 * Calculate available disk space from user storage
 * Returns available space in GB
 */
export const getAvailableSpaceGB = (usage: UsageI | null): number => {
    if (!usage) return 0
    const totalGB = convertToGB(usage.total, usage.unit)
    const usedGB = convertToGB(usage.used, usage.unit)
    const availableGB = totalGB - usedGB
    return Math.max(0, availableGB) // Ensure non-negative
}

/**
 * Convert file size to GB for comparison
 */
export const convertFileSizeToGB = (size: number, unit: "KB" | "MB" | "GB"): number => {
    switch (unit) {
        case "KB":
            return size / (1024 * 1024)
        case "MB":
            return size / 1024
        case "GB":
            return size
        default:
            return size
    }
}
