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

  };


  // ============================================================
  // UI
  // ============================================================

  return (

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

      <input

        ref={
          inputRef
        }

        type="text"

        className="chat-message-input"

        placeholder="Type your message..."

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

        autoComplete="off"

        spellCheck="true"

        tabIndex={0}

      />


      {/* ====================================================== */}
      {/* Send Button */}
      {/* ====================================================== */}

      <button

        type="button"

        className="send-button"

        onClick={(e) => {
          e.stopPropagation();
          handleSend();
        }}

        disabled={
          disabled ||
          !message.trim()
        }

      >

        Send

      </button>


    </div>

  );

}


export default MessageInput;