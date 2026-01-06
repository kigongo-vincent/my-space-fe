import { HTMLAttributes } from "react"

export interface Props extends HTMLAttributes<HTMLParagraphElement> {
    value: string | number
}

const Text = ({ value, ...rest }: Props) => {
    return (
        <p {...rest}>
            {value}
        </p>
    )
}

export default Text