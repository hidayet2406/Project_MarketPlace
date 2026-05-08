export default function ActionToast({ message, onClose }){
    if(!message) return null

    return (
        <div 
            className="mp-toast" 
            role="status" 
            aria-live="polite"
            onClick={onClose}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
        >
            {message}
        </div>
    )
}
