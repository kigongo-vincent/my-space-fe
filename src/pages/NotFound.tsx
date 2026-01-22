import { useNavigate } from "react-router"
import { useTheme } from "../store/Themestore"
import { useUser } from "../store/Userstore"
import View from "../components/base/View"
import Text from "../components/base/Text"
import Button from "../components/base/Button"
import { ArrowLeft } from "lucide-react"

const NotFound = () => {
    const { current } = useTheme()
    const { isAuthenticated, current: user } = useUser()
    const navigate = useNavigate()

    const handleGoHome = () => {
        if (isAuthenticated) {
            if (user?.role === "admin") {
                navigate("/admin")
            } else {
                navigate("/dashboard")
            }
        } else {
            navigate("/")
        }
    }

    return (
        <View 
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: current?.background }}
        >
            <View 
                mode="foreground"
                className="w-full max-w-md p-8 rounded-lg text-center"
                style={{
                    boxShadow: `0 20px 25px -5px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                <Text 
                    value="404" 
                    className="text-8xl font-bold mb-4"
                    style={{ color: current?.primary }}
                />
                <Text 
                    value="Page Not Found" 
                    className="text-2xl font-semibold mb-2"
                    style={{ color: current?.dark }}
                />
                <Text 
                    value="The page you're looking for doesn't exist or has been moved." 
                    className="mb-8 opacity-70"
                    size="sm"
                />
                
                <View className="flex flex-col gap-3">
                    <Button 
                        title="Go Home" 
                        action={handleGoHome}
                        className="w-full"
                    />
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-md transition-all hover:opacity-80"
                        style={{
                            backgroundColor: current?.background,
                            border: `1px solid ${current?.dark}20`,
                            color: current?.dark
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span style={{ fontSize: "13px" }}>Go Back</span>
                    </button>
                </View>
            </View>
        </View>
    )
}

export default NotFound
