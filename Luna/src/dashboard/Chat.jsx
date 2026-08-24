import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";

import "../styles/Chat.css";

import { sendMessage } from "../services/chatService";

import {
  loadMemories,
  addMemory,
} from "../services/memoryStorage";

import {
  readDocument,
} from "../services/documentService";


// ============================================================
// Desktop Command Detection
// ============================================================

function detectDesktopCommand(text) {

  const lower =
    text
      .toLowerCase()
      .trim();


  // ==============================
  // Search Web
  // ==============================

  const searchPatterns = [

    /^search (?:google|the web|web|browser) (?:for )?(.+)$/i,

    /^search (?:for )?(.+) (?:on google|on the web|in browser)$/i,

    /^google (.+)$/i,

    /^search this on (?:google|the browser|browser):?\s*(.+)$/i,

    /^search (?:this|it) (?:on )?(?:google|the web|browser)$/i,

  ];


  for (
    const pattern of searchPatterns
  ) {

    const match =
      lower.match(pattern);


    if (match) {

      const query =
        match[1]?.trim();


      if (query) {

        return {
          type: "search_web",
          query,
        };

      }

    }

  }


  // ==============================
  // Open Any Desktop Application
  // ==============================

  const openMatch =
    text
      .trim()
      .match(/^(?:open|launch|start|run)\s+(?:the\s+)?(.+)$/i);


  if (openMatch) {

    const appName =
      openMatch[1]
        .trim()
        .replace(/[?.!]+$/, "");


    if (appName) {

      return {
        type: "open_app",
        app: appName,
      };

    }

  }


  return null;

}


// ============================================================
// Chat Component
// ============================================================

function Chat({
  conversation,
  updateMessages,
  settings,
}) {

  const messages = useMemo(
    () => conversation?.messages || [],
    [conversation?.messages]
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    document,
    setDocument,
  ] = useState(null);


  const [
    documentMode,
    setDocumentMode,
  ] = useState(false);


  const bottomRef =
    useRef(null);


  // ==============================
  // Memory Command
  // ==============================

  function handleMemoryCommand(
    text
  ) {

    const prefix =
      "remember that";


    const lowerText =
      text
        .toLowerCase()
        .trim();


    if (
      !lowerText.startsWith(
        prefix
      )
    ) {

      return false;

    }


    const memoryText =
      text
        .trim()
        .substring(
          prefix.length
        )
        .trim();


    if (!memoryText) {

      return false;

    }


    addMemory({

      id: Date.now(),

      title:
        "User Memory",

      value:
        memoryText,

    });


    return true;

  }


  // ==============================
  // Auto Scroll
  // ==============================

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  // ==============================
  // File Upload
  // ==============================

  async function handleFileSelect(
    file
  ) {

    try {

      const loadedDocument =
        await readDocument(file);


      setDocument(
        loadedDocument
      );


    } catch (error) {

      console.error(
        "File upload failed: " + error.message
      );

    }

  }


  // ============================================================
  // Desktop Command
  // ============================================================

  async function handleDesktopCommand(
    command
  ) {

    if (
      !window.electronAPI
    ) {

      return false;

    }


    // ==============================
    // Open App
    // ==============================

    if (
      command.type ===
      "open_app"
    ) {

      const result =
        await window.electronAPI.openApp(
          command.app
        );


      const assistantMessage = {

        id:
          Date.now(),

        sender:
          "assistant",

        text:
          result.message,

      };


      const finalMessages = [

        ...messages,

        assistantMessage,

      ];


      updateMessages(
        finalMessages
      );


      return true;

    }


    // ==============================
    // Search Web
    // ==============================

    if (
      command.type ===
      "search_web"
    ) {

      const result =
        await window.electronAPI.searchWeb(
          command.query
        );


      const assistantMessage = {

        id:
          Date.now(),

        sender:
          "assistant",

        text:
          result.message,

      };


      const finalMessages = [

        ...messages,

        assistantMessage,

      ];


      updateMessages(
        finalMessages
      );


      return true;

    }


    return false;

  }


  // ==============================
  // Send Message
  // ==============================

  async function handleSend(
    text
  ) {

    if (
      !text.trim()
    ) {

      return;

    }


    // ============================================================
    // DESKTOP COMMAND CHECK
    // ============================================================

    const desktopCommand =
      detectDesktopCommand(
        text
      );


    if (
      desktopCommand
    ) {

      // First show user's command

      const userMessage = {

        id:
          Date.now(),

        sender:
          "user",

        text,

      };


      const updatedMessages = [

        ...messages,

        userMessage,

      ];


      updateMessages(
        updatedMessages
      );


      // Execute command

      setLoading(true);


      try {

        await handleDesktopCommand(
          desktopCommand
        );

      } catch (error) {

        console.error(
          "Desktop command error:",
          error
        );


        const errorMessage = {

          id:
            Date.now() + 1,

          sender:
            "assistant",

          text:
            "I couldn't complete that desktop action.",

        };


        const finalMessages = [

          ...updatedMessages,

          errorMessage,

        ];


        updateMessages(
          finalMessages
        );

      } finally {

        setLoading(false);

      }


      return;

    }


    // ============================================================
    // MEMORY COMMAND
    // ============================================================

    const memoryCreated =
      handleMemoryCommand(
        text
      );


    if (
      memoryCreated
    ) {

      const userMessage = {

        id:
          Date.now(),

        sender:
          "user",

        text,

      };


      const assistantMessage = {

        id:
          Date.now() + 1,

        sender:
          "assistant",

        text:
          "Got it. I'll remember that.",

      };


      const finalMessages = [

        ...messages,

        userMessage,

        assistantMessage,

      ];


      updateMessages(
        finalMessages
      );


      return;

    }


    // ============================================================
    // NORMAL USER MESSAGE
    // ============================================================

    const userMessage = {

      id:
        Date.now(),

      sender:
        "user",

      text,

    };


    const updatedMessages = [

      ...messages,

      userMessage,

    ];


    updateMessages(
      updatedMessages
    );


    setLoading(true);


    try {

      // ==============================
      // Document Context
      // ==============================

      let documentContext = "";


      if (
        document &&
        documentMode
      ) {

        documentContext = `

Document Name:
${document.name}

Document Content:
${document.content}

`;

      }


      // ==============================
      // Memories
      // ==============================

      const memories =
        loadMemories();


      // ==============================
      // Ollama
      // ==============================

      const reply =
        await sendMessage(

          text,

          documentContext,

          memories,

          settings?.aiModel || "qwen2.5:3b"

        );


      // ==============================
      // Assistant Message
      // ==============================

      const assistantMessage = {

        id:
          Date.now() + 1,

        sender:
          "assistant",

        text:
          reply,

      };


      const finalMessages = [

        ...updatedMessages,

        assistantMessage,

      ];


      updateMessages(
        finalMessages
      );


    } catch (error) {

      console.error(
        "Chat error:",
        error
      );


      const errorMessage = {

        id:
          Date.now() + 2,

        sender:
          "assistant",

        text:
          "Something went wrong.",

      };


      const finalMessages = [

        ...updatedMessages,

        errorMessage,

      ];


      updateMessages(
        finalMessages
      );


    } finally {

      setLoading(false);

    }

  }


  // ==============================
  // No Conversation
  // ==============================

  if (!conversation) {

    return (

      <div className="chat-container">

        <h2>
          No conversation selected
        </h2>

      </div>

    );

  }


  // ==============================
  // UI
  // ==============================

  return (

    <div className="chat-container">


      {/* Header */}

      <div className="chat-header">

        <h2>
          {conversation.title}
        </h2>

      </div>


      {/* Messages */}

      <div className="chat-messages">

        {messages.map(
          (message) => (

            <ChatBubble

              key={
                message.id
              }

              sender={
                message.sender
              }

              text={
                message.text
              }

            />

          )
        )}


        {loading && (

          <div className="typing-message">

            {
              settings?.assistantName ||
              "Luna"
            }{" "}

            is typing...

          </div>

        )}


        <div
          ref={bottomRef}
        />

      </div>


      {/* Document */}

      {document && (

        <div className="chat-document">

          <div className="chat-document-info">

            {document.name}

          </div>


          <button

            type="button"

            className="chat-document-mode"

            onClick={() =>
              setDocumentMode(
                !documentMode
              )
            }

          >

            {documentMode

              ? "Document Mode ON"

              : "Ask Document"

            }

          </button>


          <button

            type="button"

            className="chat-document-remove"

            onClick={() => {

              setDocument(null);

              setDocumentMode(
                false
              );

            }}

          >

            ✕

          </button>

        </div>

      )}


      {/* Message Input */}

      <MessageInput

        onSend={
          handleSend
        }

        onFileSelect={
          handleFileSelect
        }

        disabled={
          loading
        }

      />

    </div>

  );

}


export default Chat;