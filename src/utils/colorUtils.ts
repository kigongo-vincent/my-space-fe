/**
 * Convert a hex color to a pastel version (lighter, more muted)
 */
export const getPastelColor = (hexColor: string, opacity: number = 0.15): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '')
    
    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Return as rgba with specified opacity
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
