import { useRef, useState } from "react";
import "../styles/MessageInput.css";

function MessageInput({
    onSend,
    disabled,
    onFileSelect,
}) {

    const [message, setMessage] = useState("");

    const fileInputRef = useRef(null);

    function handleSend() {
        if (!message.trim()) return;

        onSend(message);

        setMessage("");

    }

    function handleKeyDown(e) {

        if (e.key === "Enter") {

            handleSend();

        }

    }

    function handleFileButton() {

        fileInputRef.current?.click();

    }

    function handleFileChange(e) {

        const file = e.target.files[0];

        if (!file) return;

        if (onFileSelect) {

            onFileSelect(file);

        }

        // Allows selecting the same file again later
        e.target.value = "";

    }

    return (

        <div className="message-input">

            {/* File Upload */}

            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,text/plain,application/pdf"
                className="hidden-file-input"
                onChange={handleFileChange}
                disabled={disabled}
            />

            <button
                type="button"
                className="file-button"
                onClick={handleFileButton}
                disabled={disabled}
                title="Attach TXT or PDF file"
            >
                📎
            </button>

            {/* Message Input */}

            <input
                type="text"
                placeholder="Type your message..."
                value={message}
                disabled={disabled}
                onChange={(e) =>
                    setMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
            />

            {/* Send */}

            <button
                type="button"
                className="send-button"
                onClick={handleSend}
                disabled={disabled}
            >
                Send
            </button>

        </div>

    );

}

export default MessageInput;