import { HTMLAttributes } from "react"

export interface Props extends HTMLAttributes<HTMLParagraphElement> {
    value: string | number
    size?: "md" | "lg" | "sm"
}

const Text = ({ value, size, className, ...rest }: Props) => {
    return (
        <p {...rest} className={` ${size == "sm" ? "text-[11.5px]" : size == "md" ? "text-[14px]" : size == "lg" ? "text-[24px]" : "text-[12px]"} ${className}`}>
            {value}
        </p>
    )
}

export default Text