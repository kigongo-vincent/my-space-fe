/**
 * Generate color variations from primary color for charts
 * Returns an array of colors that accent the primary color
 */
export const getPrimaryColorVariations = (primaryColor: string): string[] => {
    // Parse hex color to RGB
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Generate variations
    const variations: string[] = []
    
    // Base primary color
    variations.push(primaryColor)
    
    // Lighter variations (increase brightness)
    for (let i = 1; i <= 3; i++) {
        const factor = 0.2 * i
        const newR = Math.min(255, Math.round(r + (255 - r) * factor))
        const newG = Math.min(255, Math.round(g + (255 - g) * factor))
        const newB = Math.min(255, Math.round(b + (255 - b) * factor))
        variations.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`)
    }
    
    // Darker variations (decrease brightness)
    for (let i = 1; i <= 2; i++) {
        const factor = 0.15 * i
        const newR = Math.max(0, Math.round(r * (1 - factor)))
        const newG = Math.max(0, Math.round(g * (1 - factor)))
        const newB = Math.max(0, Math.round(b * (1 - factor)))
        variations.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`)
    }
    
    return variations
}

/**
 * Get primary color with opacity
 */
export const getPrimaryColorWithOpacity = (primaryColor: string, opacity: number): string => {
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
