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


// ==============================
// Welcome Message
// ==============================

function createWelcomeMessage(settings) {

  return {
    id: Date.now(),
    sender: "assistant",
    text: `Hello! I'm ${
      settings.assistantName || "Luna"
    }. How can I help you today?`,
  };

}


function Dashboard() {

  // ==============================
  // Settings
  // ==============================

  const [settings, setSettings] =
    useState(() => loadSettings());


  // ==============================
  // Sidebar Page
  // ==============================

  const [currentPage, setCurrentPage] =
    useState("chat");


  // ==============================
  // Load Existing Conversations
  // ==============================

  const initialChats =
    loadConversations();


  // ==============================
  // Conversations
  // ==============================

  const [conversations, setConversations] =
    useState(() => {

      if (initialChats.length > 0) {

        return initialChats;

      }


      const firstChat = {

        id: Date.now(),

        title: "New Chat",

        messages: [
          createWelcomeMessage(settings)
        ],

      };


      saveConversations([
        firstChat
      ]);


      return [
        firstChat
      ];

    });


  // ==============================
  // Active Conversation
  // ==============================

  const [activeChatId, setActiveChatId] =
    useState(() => {

      if (initialChats.length > 0) {

        return initialChats[0].id;

      }

      return null;

    });


  // ==============================
  // Apply Theme
  // ==============================

  useEffect(() => {

    document.body.setAttribute(
      "data-theme",
      settings.theme
    );

  }, [settings.theme]);


  // ==============================
  // Create New Chat
  // ==============================

  function createNewChat() {

    const newChat = {

      id: Date.now(),

      title: "New Chat",

      messages: [
        createWelcomeMessage(settings)
      ],

    };


    const updatedChats = [

      ...conversations,

      newChat,

    ];


    setConversations(
      updatedChats
    );

    setActiveChatId(
      newChat.id
    );

    saveConversations(
      updatedChats
    );

    setCurrentPage("chat");

  }


  // ==============================
  // Select Previous Chat
  // ==============================

  function selectChat(id) {

    setActiveChatId(id);

    setCurrentPage("chat");

  }


  // ==============================
  // Update Messages
  // ==============================

  function updateMessages(messages) {

    const updatedChats =
      conversations.map(chat => {

        if (
          chat.id !== activeChatId
        ) {

          return chat;

        }


        let title =
          chat.title;


        const firstUserMessage =
          messages.find(
            msg =>
              msg.sender === "user"
          );


        if (
          title === "New Chat" &&
          firstUserMessage
        ) {

          title =
            firstUserMessage.text.length > 30
              ? firstUserMessage.text.substring(
                  0,
                  30
                ) + "..."
              : firstUserMessage.text;

        }


        return {

          ...chat,

          title,

          messages,

        };

      });


    setConversations(
      updatedChats
    );

    saveConversations(
      updatedChats
    );

  }


  // ==============================
  // Delete Chat
  // ==============================

  function deleteChat(id) {

    const updatedChats =
      conversations.filter(
        chat => chat.id !== id
      );


    if (
      updatedChats.length === 0
    ) {

      const firstChat = {

        id: Date.now(),

        title: "New Chat",

        messages: [
          createWelcomeMessage(settings)
        ],

      };


      setConversations([
        firstChat
      ]);

      setActiveChatId(
        firstChat.id
      );

      saveConversations([
        firstChat
      ]);

      return;

    }


    setConversations(
      updatedChats
    );

    setActiveChatId(
      updatedChats[0].id
    );

    saveConversations(
      updatedChats
    );

  }


  // ==============================
  // Clear All Chats
  // ==============================

  function clearAllChats() {

    console.log(
      "Dashboard function called"
    );


    const firstChat = {

      id: Date.now(),

      title: "New Chat",

      messages: [
        createWelcomeMessage(settings)
      ],

    };


    setConversations([
      firstChat
    ]);

    setActiveChatId(
      firstChat.id
    );

    setCurrentPage("chat");

    saveConversations([
      firstChat
    ]);

  }


  // ==============================
  // Active Conversation
  // ==============================

  const activeConversation =
    conversations.find(
      chat =>
        chat.id === activeChatId
    );


  // ==============================
  // UI
  // ==============================

  return (

    <div className="dashboard">


      <Sidebar

        currentPage={
          currentPage
        }

        setCurrentPage={
          setCurrentPage
        }

        settings={
          settings
        }

        conversations={
          conversations
        }

        activeChatId={
          activeChatId
        }

        onNewChat={
          createNewChat
        }

        onSelectChat={
          selectChat
        }

        onDeleteChat={
          deleteChat
        }

      />


      <div className="content">


        {/* ============================== */}
        {/* Chat */}
        {/* ============================== */}

        {currentPage === "chat" &&
          activeConversation && (

            <Chat

              key={activeChatId}

              conversation={
                activeConversation
              }

              updateMessages={
                updateMessages
              }

              settings={
                settings
              }

            />

        )}


        {/* ============================== */}
        {/* Memory */}
        {/* ============================== */}

        {currentPage === "memory" && (

          <Memory />

        )}


        {/* ============================== */}
        {/* Settings */}
        {/* ============================== */}

        {currentPage === "setting" && (

          <Setting

            onSettingsSaved={
              (updatedSettings) => {

                setSettings(
                  updatedSettings
                );


                document.body.setAttribute(
                  "data-theme",
                  updatedSettings.theme
                );

              }
            }

          />

        )}


        {/* ============================== */}
        {/* Privacy */}
        {/* ============================== */}

        {currentPage === "privacy" && (

          <Privacy

            onClearChats={
              clearAllChats
            }

          />

        )}

      </div>

    </div>

  );

}


export default Dashboard;