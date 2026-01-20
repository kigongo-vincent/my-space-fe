import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import Button from "../base/Button"
import { X, Check, Star, Zap, Shield, HardDrive } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import AnimatedModal from "../base/AnimatedModal"
import { motion } from "framer-motion"

interface Props {
    onClose: () => void
}

interface PlanFeature {
    text: string
    icon?: React.ReactNode
}

interface StoragePlan {
    name: string
    storage: number
    unit: "GB" | "TB"
    price: string
    popular?: boolean
    features: PlanFeature[]
    icon: React.ReactNode
}

const StoragePurchaseModal = ({ onClose }: Props) => {
    const { current, name } = useTheme()
    const { usage, setUsage } = useUser()
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

    const storagePlans: StoragePlan[] = [
        { 
            name: "Basic", 
            storage: 50, 
            unit: "GB" as const, 
            price: "$4.99/month",
            features: [
                { text: "50GB storage" },
                { text: "Basic support" },
                { text: "File sharing" }
            ],
            icon: <HardDrive size={24} />
        },
        { 
            name: "Standard", 
            storage: 200, 
            unit: "GB" as const, 
            price: "$9.99/month",
            popular: true,
            features: [
                { text: "200GB storage" },
                { text: "Priority support" },
                { text: "Advanced sharing" },
                { text: "Version history" }
            ],
            icon: <Zap size={24} />
        },
        { 
            name: "Premium", 
            storage: 1, 
            unit: "TB" as const, 
            price: "$19.99/month",
            features: [
                { text: "1TB storage" },
                { text: "24/7 support" },
                { text: "Unlimited sharing" },
                { text: "Full version history" },
                { text: "Advanced security" }
            ],
            icon: <Star size={24} />
        },
        { 
            name: "Enterprise", 
            storage: 5, 
            unit: "TB" as const, 
            price: "$49.99/month",
            features: [
                { text: "5TB storage" },
                { text: "Dedicated support" },
                { text: "Team collaboration" },
                { text: "Unlimited version history" },
                { text: "Enterprise security" },
                { text: "Custom integrations" }
            ],
            icon: <Shield size={24} />
        }
    ]

    const handlePurchase = (plan: StoragePlan) => {
        // Simulate purchase
        setUsage({
            total: plan.storage,
            unit: plan.unit,
            used: usage.used
        })
        alert(`Purchased ${plan.name} plan!`)
        onClose()
    }

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="lg">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 flex flex-col gap-6"
            >
                <View className="flex items-center justify-between">
                    <View className="flex flex-col gap-1">
                        <Text value="Purchase Storage" className="font-semibold text-xl" />
                        <Text value="Choose a storage plan that fits your needs" className="opacity-70 text-sm" />
                    </View>
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                <View className="grid grid-cols-2 gap-4">
                    {storagePlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-5 rounded-lg flex flex-col gap-4 cursor-pointer relative border-2"
                            style={{
                                backgroundColor: current?.background,
                                borderColor: selectedPlan === index 
                                    ? current?.primary 
                                    : plan.popular 
                                        ? current?.primary + "40"
                                        : "transparent",
                                boxShadow: selectedPlan === index
                                    ? `0 8px 24px ${current?.primary}30`
                                    : undefined
                            }}
                            style={{
                                borderColor: selectedPlan === index 
                                    ? current?.primary 
                                    : plan.popular 
                                        ? current?.primary + "40"
                                        : "transparent",
                                boxShadow: selectedPlan === index
                                    ? `0 8px 24px ${current?.primary}30`
                                    : plan.popular
                                        ? `0 4px 12px ${current?.primary}20`
                                        : "none"
                            }}
                            onClick={() => setSelectedPlan(index)}
                        >
                            {plan.popular && (
                                <View
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{ 
                                        backgroundColor: current?.primary,
                                        color: "white"
                                    }}
                                >
                                    <Text value="POPULAR" className="text-xs font-bold" style={{ color: "white" }} />
                                </View>
                            )}

                            <View className="flex items-start justify-between">
                                <View className="flex items-center gap-3">
                                    <View 
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: current?.primary + "15" }}
                                    >
                                        <div style={{ color: current?.primary }}>
                                            {plan.icon}
                                        </div>
                                    </View>
                                    <View className="flex flex-col">
                                        <Text value={plan.name} className="font-semibold text-lg" />
                                        <Text 
                                            value={`${plan.storage} ${plan.unit}`} 
                                            className="text-2xl font-bold"
                                            style={{ color: current?.primary }}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View className="flex flex-col gap-2">
                                <Text 
                                    value={plan.price} 
                                    className="text-lg font-semibold"
                                    style={{ color: current?.primary }}
                                />
                            </View>

                            <View className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: current?.dark + "15" }}>
                                {plan.features.map((feature, featureIndex) => (
                                    <View key={featureIndex} className="flex items-center gap-2">
                                        <Check 
                                            size={16} 
                                            style={{ color: current?.success, flexShrink: 0 }}
                                        />
                                        <Text 
                                            value={feature.text} 
                                            size="sm" 
                                            className="opacity-80"
                                        />
                                    </View>
                                ))}
                            </View>

                            <motion.button
                                onClick={() => handlePurchase(plan)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="mt-auto flex items-center p-2.5 rounded-md justify-center gap-2 h-10"
                                style={{
                                    backgroundColor: selectedPlan === index 
                                        ? current?.success 
                                        : current?.primary,
                                    color: "white",
                                    fontSize: "13px",
                                    opacity: selectedPlan === index ? 0.9 : 1,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {selectedPlan === index ? "Selected" : "Select Plan"}
                            </motion.button>
                        </motion.div>
                    ))}
                </View>

                <View className="flex items-center gap-2 justify-end pt-2 border-t" style={{ borderColor: current?.dark + "15" }}>
                    <Button title="Cancel" action={onClose} />
                </View>
            </motion.div>
        </AnimatedModal>
    )
}

export default StoragePurchaseModal
