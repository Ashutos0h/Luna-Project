import {
  useState,
  useRef,
  useEffect,
} from "react";

import "../styles/MessageInput.css";


function MessageInput({
  onSend,
  disabled = false,
  onFileSelect,
  generating = false,
  onStop,
  settings,
}) {

  // ============================================================
  // Message State
  // ============================================================

  const [message, setMessage] =
    useState("");


  // ============================================================
  // Refs
  // ============================================================

  const inputRef =
    useRef(null);

  const fileInputRef =
    useRef(null);


  // ============================================================
  // Focus Input
  // ============================================================

  const focusInput = () => {

    const input =
      inputRef.current;


    if (input && !disabled) {

      input.focus();

    }

  };


  // ============================================================
  // Auto Focus on mount and when disabled turns false
  // ============================================================

  useEffect(() => {

    if (!disabled) {

      if (inputRef.current) {

        inputRef.current.focus();

      }


      const timer = setTimeout(() => {

        if (inputRef.current) {

          inputRef.current.focus();

        }

      }, 50);


      return () => clearTimeout(timer);

    }

  }, [disabled]);


  // ============================================================
  // Send Message
  // ============================================================

  const handleSend = () => {

    const text =
      message.trim();


    if (
      disabled ||
      !text
    ) {

      return;

    }


    onSend(text);


    setMessage("");

    if (inputRef.current) inputRef.current.style.height = "44px";


    setTimeout(focusInput, 50);

  };


  // ============================================================
  // Keyboard Handler
  // ============================================================

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSend();

    }

  };


  // ============================================================
  // File Button
  // ============================================================

  const handleFileButton = (e) => {
    e.stopPropagation();

    if (disabled) {

      return;

    }


    fileInputRef.current?.click();

  };


  // ============================================================
  // File Selected
  // ============================================================

  const handleFileChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {

      return;

    }


    if (onFileSelect) {

      onFileSelect(file);

    }


    // Allow selecting the same file again
    event.target.value = "";


    setTimeout(focusInput, 50);

  };


  // ============================================================
  // Input Change
  // ============================================================

  const handleChange = (
    event
  ) => {

    setMessage(
      event.target.value
    );

    event.target.style.height = "44px";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="composer-shell">
    <div className="message-input" onClick={focusInput}>


      {/* ====================================================== */}
      {/* Hidden File Input */}
      {/* ====================================================== */}

      <input

        ref={
          fileInputRef
        }

        type="file"

        accept=".txt,.pdf,text/plain,application/pdf"

        className="hidden-file-input"

        onChange={
          handleFileChange
        }

        disabled={
          disabled
        }

      />


      {/* ====================================================== */}
      {/* Attach Button */}
      {/* ====================================================== */}

      <button

        type="button"

        className="file-button"

        onClick={
          handleFileButton
        }

        disabled={
          disabled
        }

        title="Attach TXT or PDF"

      >

        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>

      </button>


      {/* ====================================================== */}
      {/* Message Input */}
      {/* ====================================================== */}

      <textarea

        ref={
          inputRef
        }

        className="chat-message-input"

        placeholder={`Message ${settings?.assistantName || "Luna"}…`}
        aria-label={`Message ${settings?.assistantName || "Luna"}`}

        value={
          message
        }

        onChange={
          handleChange
        }

        onKeyDown={
          handleKeyDown
        }

        disabled={
          disabled
        }

        spellCheck

        rows={1}

        tabIndex={0}

      />


      {/* ====================================================== */}
      {/* Send Button */}
      {/* ====================================================== */}

      <button

        type="button"

        className={`send-button${generating ? " stop-button" : ""}`}

        onClick={(e) => {
          e.stopPropagation();
          if (generating) onStop?.();
          else handleSend();
        }}

        disabled={
          generating
            ? !onStop
            : disabled || !message.trim()
        }

        aria-label={generating ? "Stop generating" : "Send message"}

      >

        {generating ? (
          <>
            <span>Stop</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </>
        ) : (
          <>
            <span>Send</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </>
        )}

      </button>



    </div>
    </div>

  );

}


export default MessageInput;
