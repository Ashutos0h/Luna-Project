import { useState, useEffect } from "react";
import { loadSettings } from "../services/settingsStorage";

import Sidebar from "./Sidebar";
import Chat from "./Chat";

import Memory from "../pages/Memory";
import Setting from "../pages/Setting";
import Privacy from "../pages/Privacy";

import "../styles/Dashboard.css";

import {
  loadConversations,
  saveConversations,
} from "../services/chatStorage";

function Dashboard() {

  // Welcome message
  const welcomeMessage = {
    id: 1,
    sender: "assistant",
    text: "Hello! I'm Luna. How can I help you today?",
  };

  // Sidebar Pages
  const [currentPage, setCurrentPage] = useState("chat");

  // Setting 
  const [settings, setSettings] = useState(loadSettings());

  // Conversations
  const [conversations, setConversations] = useState([]);

  // Selected conversation
  const [activeChatId, setActiveChatId] = useState(null);

  // Load chats on startup
  useEffect(() => {

    const savedSettings = loadSettings();

setSettings(savedSettings);

document.body.setAttribute(
  "data-theme",
  savedSettings.theme
);

    const savedChats = loadConversations();

    if (savedChats.length > 0) {

      setConversations(savedChats);

      setActiveChatId(savedChats[0].id);

    } else {

      const firstChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [welcomeMessage],
      };

      setConversations([firstChat]);

      setActiveChatId(firstChat.id);

      saveConversations([firstChat]);

    }

  }, []);

  // Create New Chat
  function createNewChat() {

    const newChat = {

      id: Date.now(),

      title: "New Chat",

      messages: [welcomeMessage],

    };

    const updatedChats = [

      ...conversations,

      newChat,

    ];

    setConversations(updatedChats);

    setActiveChatId(newChat.id);

    saveConversations(updatedChats);

    setCurrentPage("chat");

  }

  // Select Previous Chat
  function selectChat(id) {

    setActiveChatId(id);

    setCurrentPage("chat");

  }

  // Update Messages
  function updateMessages(messages) {

    const updatedChats = conversations.map(chat => {

      if (chat.id !== activeChatId) {

        return chat;

      }

      let title = chat.title;

      const firstUserMessage = messages.find(
        msg => msg.sender === "user"
      );

      if (
        title === "New Chat" &&
        firstUserMessage
      ) {

        title =
          firstUserMessage.text.length > 30
            ? firstUserMessage.text.substring(0, 30) + "..."
            : firstUserMessage.text;

      }

      return {

        ...chat,

        title,

        messages,

      };

    });

    setConversations(updatedChats);

    saveConversations(updatedChats);

  }

  // Delete Chat
  function deleteChat(id) {

    const updatedChats = conversations.filter(
      chat => chat.id !== id
    );

    if (updatedChats.length === 0) {

      const firstChat = {

        id: Date.now(),

        title: "New Chat",

        messages: [welcomeMessage],

      };

      setConversations([firstChat]);

      setActiveChatId(firstChat.id);

      saveConversations([firstChat]);

      return;

    }

    setConversations(updatedChats);

    setActiveChatId(updatedChats[0].id);

    saveConversations(updatedChats);

  }

  // Active Conversation
  const activeConversation = conversations.find(
    chat => chat.id === activeChatId
  );

  return (

    <div className="dashboard">

<Sidebar
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}

    settings={settings}

    conversations={conversations}
    activeChatId={activeChatId}
    onNewChat={createNewChat}
    onSelectChat={selectChat}
    onDeleteChat={deleteChat}
/>

      <div className="content">

        {currentPage === "chat" && activeConversation && (

<Chat
    conversation={activeConversation}
    updateMessages={updateMessages}
    settings={settings}
/>

        )}

        {currentPage === "memory" && (

          <Memory />

        )}

{currentPage === "setting" && (

    <Setting

        onSettingsSaved={(updatedSettings) => {

            setSettings(updatedSettings);

            document.body.setAttribute(
                "data-theme",
                updatedSettings.theme
            );

        }}

    />

)}

        {currentPage === "privacy" && (

          <Privacy />

        )}

      </div>

    </div>

  );

}

export default Dashboard;