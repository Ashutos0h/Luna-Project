import {
  useState,
  useEffect,
  useRef,
} from "react";

import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";

import "../styles/Chat.css";

import { sendMessage } from "../services/chatService";

import {
  loadMemories,
  addMemory,
} from "../services/memoryStorage";

import { readDocument } from "../services/documentService";


function Chat({
  conversation,
  updateMessages,
  settings,
}) {

  const [messages, setMessages] =
    useState(
      () => conversation?.messages || []
    );

  const [loading, setLoading] =
    useState(false);


  const [document, setDocument] =
    useState(null);

  const [documentMode, setDocumentMode] =
    useState(false);


  const bottomRef =
    useRef(null);


  // ==============================
  // Handle Memory Command
  // ==============================

  function handleMemoryCommand(text) {

    const prefix =
      "remember that";


    const lowerText =
      text.toLowerCase().trim();


    if (
      !lowerText.startsWith(prefix)
    ) {

      return false;

    }


    const memoryText =
      text
        .trim()
        .substring(prefix.length)
        .trim();


    if (!memoryText) {

      return false;

    }


    addMemory({

      id: Date.now(),

      title: "User Memory",

      value: memoryText,

    });


    console.log(
      "Memory created:",
      memoryText
    );


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

  async function handleFileSelect(file) {

    try {

      const loadedDocument =
        await readDocument(file);


      setDocument(
        loadedDocument
      );


      console.log(
        "Document loaded:",
        loadedDocument.name
      );


      console.log(
        "Document content:",
        loadedDocument.content
      );


      console.log(
        "Document content length:",
        loadedDocument.content.length
      );

    } catch (error) {

      console.error(
        "File upload error:",
        error
      );


      alert(
        error.message
      );

    }

  }


  // ==============================
  // Send Message
  // ==============================

  async function handleSend(text) {

    if (!text.trim()) {

      return;

    }


    // ==============================
    // Memory Command
    // ==============================

    const memoryCreated =
      handleMemoryCommand(text);


    if (memoryCreated) {

      const userMessage = {

        id: Date.now(),

        sender: "user",

        text,

      };


      const assistantMessage = {

        id: Date.now() + 1,

        sender: "assistant",

        text:
          "Got it. I'll remember that.",

      };


      const finalMessages = [

        ...messages,

        userMessage,

        assistantMessage,

      ];


      setMessages(
        finalMessages
      );

      updateMessages(
        finalMessages
      );


      return;

    }


    // ==============================
    // Normal User Message
    // ==============================

    const userMessage = {

      id: Date.now(),

      sender: "user",

      text,

    };


    const updatedMessages = [

      ...messages,

      userMessage,

    ];


    setMessages(
      updatedMessages
    );

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


      console.log(
        "Document Context:",
        documentContext
      );


      // ==============================
      // Load Memories
      // ==============================

      const memories =
        loadMemories();


      console.log(
        "Memories being sent:",
        memories
      );


      // ==============================
      // Send to AI
      // ==============================

      const reply =
        await sendMessage(
          text,
          documentContext,
          memories
        );


      // ==============================
      // Assistant Message
      // ==============================

      const assistantMessage = {

        id: Date.now() + 1,

        sender: "assistant",

        text: reply,

      };


      const finalMessages = [

        ...updatedMessages,

        assistantMessage,

      ];


      setMessages(
        finalMessages
      );

      updateMessages(
        finalMessages
      );


    } catch (error) {

      console.error(
        "Chat error:",
        error
      );


      const errorMessage = {

        id: Date.now() + 2,

        sender: "assistant",

        text:
          "Something went wrong.",

      };


      const finalMessages = [

        ...updatedMessages,

        errorMessage,

      ];


      setMessages(
        finalMessages
      );

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


      {/* Chat Header */}

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

              key={message.id}

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

            📄 {document.name}

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

              ? "📄 Document Mode ON"

              : "📄 Ask Document"

            }

          </button>


          <button

            type="button"

            className="chat-document-remove"

            onClick={() => {

              setDocument(null);

              setDocumentMode(false);

            }}

          >

            ✕

          </button>


        </div>

      )}


      {/* Message Input */}

      <MessageInput

        onSend={handleSend}

        onFileSelect={
          handleFileSelect
        }

        disabled={loading}

      />


    </div>

  );

}


export default Chat;