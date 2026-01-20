import { useState, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CustomSelectProps {
    value: string | number
    onChange: (value: string | number) => void
    options: { value: string | number; label: string }[]
    placeholder?: string
    className?: string
    useBackgroundMode?: boolean
}

const CustomSelect = ({ value, onChange, options, placeholder, className, useBackgroundMode = false }: CustomSelectProps) => {
    const { current, getBackgroundColor } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)
    
    const backgroundColor = useBackgroundMode ? getBackgroundColor("background") : current?.foreground
    const dropdownBackgroundColor = useBackgroundMode ? getBackgroundColor("background") : current?.foreground

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <View className={`relative ${className}`} ref={selectRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 outline-none transition-all"
                style={{
                    backgroundColor: backgroundColor,
                    color: current?.dark,
                    borderRadius: '0.25rem',
                    fontSize: '1rem'
                }}
            >
                <Text 
                    value={selectedOption?.label || placeholder || "Select..."} 
                    style={{ 
                        fontSize: '1rem',
                        color: selectedOption ? current?.dark : `${current?.dark}60`
                    }} 
                />
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown 
                        size={18} 
                        color={current?.dark}
                    />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 z-50 mt-1"
                        style={{
                            backgroundColor: dropdownBackgroundColor,
                            borderRadius: '0.25rem',
                            boxShadow: `0 4px 12px ${current?.dark}15`,
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}
                    >
                        {options.map((option, index) => (
                            <motion.button
                                key={option.value}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className="w-full text-left px-3 py-2"
                                style={{
                                    backgroundColor: value === option.value ? `${current?.primary}15` : 'transparent',
                                    color: value === option.value ? current?.primary : current?.dark,
                                    fontSize: '1rem',
                                    transition: 'background-color 0.15s'
                                }}
                                whileHover={{
                                    backgroundColor: value !== option.value ? `${current?.dark}08` : undefined
                                }}
                            >
                                <Text value={option.label} style={{ fontSize: '1rem' }} />
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </View>
    )
}

export default CustomSelect
