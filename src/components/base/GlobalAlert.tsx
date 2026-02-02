import { useAlertStore } from "../../store/AlertStore"
import AlertModal from "./AlertModal"

const GlobalAlert = () => {
    const { isOpen, message, type, title, close } = useAlertStore()

    return (
        <AlertModal
            isOpen={isOpen}
            onClose={close}
            message={message}
            type={type}
            title={title}
        />
    )
}

export default GlobalAlert
