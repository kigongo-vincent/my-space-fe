import { motion } from "framer-motion"
import { useTheme } from "../../store/Themestore"

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

const Switch = ({ checked, onChange, disabled = false, className }: SwitchProps) => {
    const { current } = useTheme()

    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative transition-all ${className || ''}`}
            style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                backgroundColor: checked ? current?.primary : `${current?.dark}30`,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
            }}
        >
            <motion.div
                animate={{
                    x: checked ? 18 : 2
                }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30
                }}
                style={{
                    position: 'absolute',
                    top: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
            />
        </button>
    )
}

export default Switch
