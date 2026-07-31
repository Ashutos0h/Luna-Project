import { useState, useEffect, useRef } from "react";
import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";
import "../styles/Chat.css";
import { sendMessage } from "../services/aiService";


function Chat() {
  // Initial assistant message
  const welcomeMessage = {
    id: 1,
    sender: "assistant",
    text: "Hello! I'm Luna. How can I help you today?",
  };

  // State
  // const [input, setInput]= useState("");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [loading, setLoading] = useState(false);

  // Reference for auto-scrolling
  const bottomRef = useRef(null);

  // Scroll to the latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Handle sending a message
  async function handleSend(message) {
    if (!message.trim()) return;

    // User message
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    // Display user message immediately
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      // Send message to Electron
      const reply = await sendMessage(message);

      // Display assistant response
      const assistantMessage = {
        id: Date.now() + 1,
        sender: "assistant",
        text: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);

      // Display error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "assistant",
          text: "Something went wrong while generating the response.",
        },
      ]);
    } finally {
      // Always stop loading
      setLoading(false);
    }
  }

  // Start a new chat
  function handleNewChat() {
    setMessages([welcomeMessage]);
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h2>Luna Chat</h2>

        <button onClick={handleNewChat}>
          + New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            sender={message.sender}
            text={message.text}
          />
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="typing-message">
            Luna is typing...
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={loading}
      />
    </div>
  );
}

export default Chat;