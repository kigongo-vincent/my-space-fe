import { HTMLAttributes } from "react"

export interface Props extends HTMLAttributes<HTMLParagraphElement> {
    value: string | number
    size?: "md" | "lg" | "sm"
}

const Text = ({ value, size, className, ...rest }: Props) => {
    return (
        <p {...rest} className={` ${size == "sm" ? "text-[0.85rem]" : size == "md" ? "text-[1.04rem]" : size == "lg" ? "text-[1.78rem]" : "text-[0.89rem]"} ${className}`}>
            {value}
        </p>
    )
}

export default Text