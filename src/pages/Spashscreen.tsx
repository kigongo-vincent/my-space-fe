import { useEffect, useState } from "react"
import { useTheme } from "../store/Themestore"

const Spashscreen = () => {
    const { current } = useTheme()
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setShowContent(true), 100)
    }, [])

    return (
        <div 
            className='h-[100vh] flex items-center flex-col justify-center w-full relative overflow-hidden'
            style={{ backgroundColor: current?.background }}
        >
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
                <div 
                    className="absolute rounded-full opacity-20"
                    style={{
                        width: "400px",
                        height: "400px",
                        backgroundColor: current?.primary,
                        top: "-200px",
                        left: "-200px",
                        animation: "float 6s ease-in-out infinite"
                    }}
                />
                <div 
                    className="absolute rounded-full opacity-20"
                    style={{
                        width: "300px",
                        height: "300px",
                        backgroundColor: current?.primary,
                        bottom: "-150px",
                        right: "-150px",
                        animation: "float 8s ease-in-out infinite reverse"
                    }}
                />
            </div>

            {/* SVG Animated Text */}
            <div className="relative z-10">
                <svg
                    width="600"
                    height="200"
                    viewBox="0 0 600 200"
                    className="overflow-visible"
                >
                    {/* M */}
                    <text
                        x="50"
                        y="120"
                        fontSize="120"
                        fontWeight="bold"
                        fill={current?.primary}
                        className="splash-text"
                        style={{
                            opacity: showContent ? 1 : 0,
                            transform: showContent ? "translateY(0)" : "translateY(50px)",
                            transition: "all 0.8s ease-out"
                        }}
                    >
                        M
                    </text>
                    
                    {/* y */}
                    <text
                        x="150"
                        y="120"
                        fontSize="120"
                        fontWeight="bold"
                        fill={current?.primary}
                        className="splash-text"
                        style={{
                            opacity: showContent ? 1 : 0,
                            transform: showContent ? "translateY(0)" : "translateY(50px)",
                            transition: "all 0.8s ease-out 0.1s"
                        }}
                    >
                        y
                    </text>

                    {/* space */}
                    <text
                        x="220"
                        y="120"
                        fontSize="120"
                        fontWeight="bold"
                        fill={current?.dark}
                        className="splash-text"
                        style={{
                            opacity: showContent ? 1 : 0,
                            transform: showContent ? "translateY(0)" : "translateY(50px)",
                            transition: "all 0.8s ease-out 0.2s"
                        }}
                    >
                        space
                    </text>
                </svg>

                {/* Subtitle */}
                <p 
                    className="mt-8 text-center text-lg opacity-70"
                    style={{ 
                        color: current?.dark,
                        opacity: showContent ? 0.7 : 0,
                        transform: showContent ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.8s ease-out 0.4s"
                    }}
                >
                    Ease of accessing data from anywhere in the world
                </p>
            </div>

            {/* Loading indicator */}
            <div 
                className="mt-12 relative z-10"
                style={{
                    opacity: showContent ? 1 : 0,
                    transition: "opacity 0.8s ease-out 0.6s"
                }}
            >
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{
                                backgroundColor: current?.primary,
                                animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    50% {
                        transform: translate(30px, 30px) scale(1.1);
                    }
                }
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
            `}</style>
        </div>
    )
}

export default Spashscreen
