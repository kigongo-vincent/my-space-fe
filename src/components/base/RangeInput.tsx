import { useTheme } from "../../store/Themestore"

interface RangeInputProps {
    min: number
    max: number
    value: number
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    className?: string
    fillPercentage?: number
    height?: string
}

const RangeInput = ({ 
    min, 
    max, 
    value, 
    onChange, 
    className = "", 
    fillPercentage,
    height = "6px"
}: RangeInputProps) => {
    const { current } = useTheme()
    
    // Calculate fill percentage if not provided
    const percentage = fillPercentage !== undefined 
        ? fillPercentage 
        : max > 0 ? (value / max) * 100 : 0

    return (
        <>
            <style>{`
                .custom-range-${current?.primary.replace('#', '')} {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    cursor: pointer;
                    width: 100%;
                }

                .custom-range-${current?.primary.replace('#', '')}::-webkit-slider-track {
                    background: ${current?.dark}20;
                    height: ${height};
                    border-radius: 9999px;
                }

                .custom-range-${current?.primary.replace('#', '')}::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    background: ${current?.primary};
                    height: ${height};
                    width: ${height};
                    border-radius: 50%;
                    cursor: pointer;
                    margin-top: 0;
                    box-shadow: 0 0 0 2px ${current?.background || current?.foreground};
                }

                .custom-range-${current?.primary.replace('#', '')}::-moz-range-track {
                    background: ${current?.dark}20;
                    height: ${height};
                    border-radius: 9999px;
                }

                .custom-range-${current?.primary.replace('#', '')}::-moz-range-thumb {
                    background: ${current?.primary};
                    height: ${height};
                    width: ${height};
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid ${current?.background || current?.foreground};
                    box-shadow: none;
                }

                .custom-range-${current?.primary.replace('#', '')}::-ms-track {
                    background: transparent;
                    border-color: transparent;
                    color: transparent;
                    height: ${height};
                }

                .custom-range-${current?.primary.replace('#', '')}::-ms-fill-lower {
                    background: ${current?.primary};
                    border-radius: 9999px;
                }

                .custom-range-${current?.primary.replace('#', '')}::-ms-fill-upper {
                    background: ${current?.dark}20;
                    border-radius: 9999px;
                }

                .custom-range-${current?.primary.replace('#', '')}::-ms-thumb {
                    background: ${current?.primary};
                    height: ${height};
                    width: ${height};
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid ${current?.background || current?.foreground};
                }
            `}</style>
            <div className={`relative w-full ${className}`} style={{ height: `calc(${height} + 8px)`, paddingTop: "4px", paddingBottom: "4px" }}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={onChange}
                    className={`custom-range-${current?.primary.replace('#', '')} ${className}`}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: `calc(${height} + 8px)`,
                        top: 0,
                        left: 0,
                        zIndex: 2,
                        opacity: 0,
                        cursor: "pointer"
                    }}
                />
                <div 
                    className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
                    style={{
                        height: height,
                        width: "100%",
                        backgroundColor: current?.dark + "20",
                        zIndex: 0
                    }}
                />
                <div 
                    className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
                    style={{
                        height: height,
                        width: `${percentage}%`,
                        backgroundColor: current?.primary,
                        zIndex: 1,
                        transition: "width 0.1s ease-out"
                    }}
                />
                <div 
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        height: `calc(${height} * 1.5)`,
                        width: `calc(${height} * 1.5)`,
                        backgroundColor: current?.primary,
                        left: `calc(${percentage}% - ${parseFloat(height) * 0.75}px)`,
                        zIndex: 3,
                        boxShadow: `0 0 0 2px ${current?.background || current?.foreground}`,
                        transition: "left 0.1s ease-out",
                        cursor: "pointer"
                    }}
                />
            </div>
        </>
    )
}

export default RangeInput
