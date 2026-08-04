import { useState, useEffect, useRef } from "react";
import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";
import "../styles/Chat.css";

import { sendMessage } from "../services/chatService";

import {
  loadConversations,
  saveConversations,
} from "../services/chatStorage";

function Chat() {
  // Initial welcome message
  const welcomeMessage = {
    id: 1,
    sender: "assistant",
    text: "Hello! I'm Luna. How can I help you today?",
  };

  // Current chat messages
  const [messages, setMessages] = useState([welcomeMessage]);

  // All conversations
  const [conversations, setConversations] = useState([]);

  // Active conversation
  const [activeChatId, setActiveChatId] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Auto scroll
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Load conversations when app starts
  useEffect(() => {
    const savedChats = loadConversations();

    if (savedChats.length > 0) {
      setConversations(savedChats);

      setActiveChatId(savedChats[0].id);

      setMessages(savedChats[0].messages);
    } else {
      const firstConversation = {
        id: Date.now(),
        title: "New Chat",
        messages: [welcomeMessage],
      };

      setConversations([firstConversation]);
      setActiveChatId(firstConversation.id);

      saveConversations([firstConversation]);
    }
  }, []);

  // Save whenever messages change
  useEffect(() => {
    if (!activeChatId) return;

    const updatedChats = conversations.map((chat) =>
      chat.id === activeChatId
        ? {
            ...chat,
            messages,
          }
        : chat
    );

    setConversations(updatedChats);

    saveConversations(updatedChats);

  }, [messages]);

  // Send message
  async function handleSend(message) {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setLoading(true);

    try {
      const reply = await sendMessage(message);

      const assistantMessage = {
        id: Date.now() + 1,
        sender: "assistant",
        text: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Generate title using first user message
      if (
        messages.length === 1 &&
        activeChatId
      ) {
        const updatedChats = conversations.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title:
                  message.length > 30
                    ? message.substring(0, 30) + "..."
                    : message,
              }
            : chat
        );

        setConversations(updatedChats);

        saveConversations(updatedChats);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "assistant",
          text: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // New chat
  function handleNewChat() {
    const newConversation = {
      id: Date.now(),
      title: "New Chat",
      messages: [welcomeMessage],
    };

    const updatedChats = [
      ...conversations,
      newConversation,
    ];

    setConversations(updatedChats);

    saveConversations(updatedChats);

    setActiveChatId(newConversation.id);

    setMessages(newConversation.messages);
  }

  return (
    <div className="chat-container">

      <div className="chat-header">
        <h2>Luna Chat</h2>

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

        {loading && (
          <div className="typing-message">
            Luna is typing...
          </div>
        )}

        <div ref={bottomRef}></div>

      </div>

      <MessageInput
        onSend={handleSend}
        disabled={loading}
      />

    </div>
  );
}



export default Chat;
