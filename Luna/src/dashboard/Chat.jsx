import { useState, useEffect, useRef } from "react";

import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";

import "../styles/Chat.css";

import { sendMessage } from "../services/chatService";

function Chat({ conversation, updateMessages }) {

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // Load selected conversation
  useEffect(() => {

    if (conversation) {

      setMessages(conversation.messages);

    }

  }, [conversation]);

  // Auto scroll
  useEffect(() => {

    bottomRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, [messages]);

  async function handleSend(text) {

    if (!text.trim()) return;

    const userMessage = {

      id: Date.now(),

      sender: "user",

      text,

    };

    const updatedMessages = [

      ...messages,

      userMessage,

    ];

    setMessages(updatedMessages);

    updateMessages(updatedMessages);

    setLoading(true);

    try {

      const reply = await sendMessage(text);

      const assistantMessage = {

        id: Date.now() + 1,

        sender: "assistant",

        text: reply,

      };

      const finalMessages = [

        ...updatedMessages,

        assistantMessage,

      ];

      setMessages(finalMessages);

      updateMessages(finalMessages);

    }

    catch (error) {

      console.error(error);

      const errorMessage = {

        id: Date.now() + 2,

        sender: "assistant",

        text: "Something went wrong.",

      };

      const finalMessages = [

        ...updatedMessages,

        errorMessage,

      ];

      setMessages(finalMessages);

      updateMessages(finalMessages);

    }

    finally {

      setLoading(false);

    }

  }

  if (!conversation) {

    return (

      <div className="chat-container">

        <h2>No conversation selected</h2>

      </div>

    );

  }

  return (

    <div className="chat-container">

      <div className="chat-header">

        <h2>{conversation.title}</h2>

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

<div className="chat-footer">

    <MessageInput
        onSend={handleSend}
        disabled={loading}
    />

</div>

    </div>

  );

}

export default Chat;