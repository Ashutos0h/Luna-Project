import { useState, useEffect, useRef } from "react";
import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";
import "../styles/Chat.css";

function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "assistant",
      text: "Hello! I'm Luna. How can I help you today?",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(message) {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const assistantReply = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "This is a dummy AI response. AI integration is coming soon.",
      };

      setMessages((prev) => [...prev, assistantReply]);
    }, 1000);
  }

  function handleNewChat() {
    setMessages([
      {
        id: 1,
        sender: "assistant",
        text: "Hello! I'm Luna. How can I help you today?",
      },
    ]);
  }

  return (

    <div className="chat-container">

      <div className="chat-header">

        <h2 Luna>Chat</h2>

        <button onClick={handleNewChat}>
          + New Chat
        </button>

      </div>

      <div className="chat-messages">

        {messages.map((message) => (

          <ChatBubble

            key={message.id}

            sender={message.sender}

            text={message.text}

          />

        ))}

      </div>

      <MessageInput onSend={handleSend} />

    </div>

  );
}

export default Chat;