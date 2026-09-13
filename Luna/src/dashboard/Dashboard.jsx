import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { loadSettings, resetSettings } from "../services/settingsStorage";

import Sidebar from "./Sidebar";
import Chat from "./Chat";

import Memory from "../pages/Memory";
import Setting from "../pages/Setting";
import Privacy from "../pages/Privacy";

import "../styles/Dashboard.css";

import {
  exportConversation,
  loadConversations,
  saveConversations,
} from "../services/chatStorage";
import { cancelMessage } from "../services/chatService";


// ============================================================
// Welcome Message
// ============================================================

function createWelcomeMessage(settings) {

  return {
    id: `message-${window.crypto.randomUUID()}`,

    sender: "assistant",

    text: `Hello! I'm ${
      settings.assistantName || "Luna"
    }. How can I help you today?`,
  };

}


// ============================================================
// Dashboard
// ============================================================

function Dashboard() {

  const navigate = useNavigate();

  // ==========================================================
  // Settings
  // ==========================================================

  const [settings, setSettings] =
    useState(() => loadSettings());


  // ==========================================================
  // Current Page
  // ==========================================================

  const [currentPage, setCurrentPage] =
    useState("chat");


  // ==========================================================
  // Conversations
  // ==========================================================

  const [conversations, setConversations] =
    useState(() => {

      const storedChats = loadConversations();

      if (storedChats.length > 0) {
        return storedChats;

      }


      const firstChat = {

        id: `chat-${window.crypto.randomUUID()}`,

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

  const [chatActivities, setChatActivities] = useState({});


  // ==========================================================
  // Active Conversation
  // ==========================================================

  const [activeChatId, setActiveChatId] =
    useState(() => {

      return conversations[0]?.id ?? null;

    });


  // ==========================================================
  // Apply Theme
  // ==========================================================

  useEffect(() => {

    document.body.setAttribute(
      "data-theme",
      settings.theme
    );

  }, [settings.theme]);


  useEffect(() => {
    const model = settings.aiModel || "qwen2.5:3b";
    const preloadTimer = window.setTimeout(() => {
      const warmup = window.electronAPI?.prepareAssistantModels
        ? window.electronAPI.prepareAssistantModels({
            model,
            performanceMode: settings.performanceMode || "fast",
          })
        : window.electronAPI?.preloadOllamaModel?.(model);

      warmup?.catch((error) => {
        console.warn("Model warm-up was skipped:", error);
      });
    }, 750);

    return () => window.clearTimeout(preloadTimer);
  }, [settings.aiModel, settings.performanceMode]);


  // ==========================================================
  // Create New Chat
  // ==========================================================

  const createNewChat = useCallback(() => {

    const newChat = {

      id: `chat-${window.crypto.randomUUID()}`,

      title: "New Chat",

      messages: [
        createWelcomeMessage(settings)
      ],

    };


    setConversations((currentConversations) => {
      const updatedChats = [...currentConversations, newChat];
      saveConversations(updatedChats);
      return updatedChats;
    });


    setActiveChatId(
      newChat.id
    );


    setCurrentPage(
      "chat"
    );

  }, [settings]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNewChat();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [createNewChat]);


  // ==========================================================
  // Select Chat
  // ==========================================================

  function selectChat(id) {

    setActiveChatId(id);

    setCurrentPage("chat");

  }


  // ==========================================================
  // Update Messages
  // ==========================================================

  function updateMessages(chatId, messages) {

    setConversations((currentConversations) => {
      const updatedChats =
      currentConversations.map(
        (chat) => {

          if (
            chat.id !== chatId
          ) {

            return chat;

          }


          let title =
            chat.title;


          const firstUserMessage =
            messages.find(
              (msg) =>
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
            updatedAt: Date.now(),

            messages,

          };

        }
      );

      saveConversations(updatedChats);
      return updatedChats;
    });

  }


  function updateChatActivity(chatId, nextActivity) {
    setChatActivities((currentActivities) => {
      const currentActivity = currentActivities[chatId] || {
        loading: false,
        generating: false,
        streamingText: "",
        requestId: null,
      };
      const updatedActivity = typeof nextActivity === "function"
        ? nextActivity(currentActivity)
        : { ...currentActivity, ...nextActivity };

      return {
        ...currentActivities,
        [chatId]: updatedActivity,
      };
    });
  }


  function removeChatActivity(chatId) {
    setChatActivities((currentActivities) => {
      const updatedActivities = { ...currentActivities };
      delete updatedActivities[chatId];
      return updatedActivities;
    });
  }


  // ==========================================================
  // Delete Chat
  // ==========================================================

  function deleteChat(id) {

    const activeRequestId = chatActivities[id]?.requestId;
    if (activeRequestId) void cancelMessage(activeRequestId);
    removeChatActivity(id);

    setConversations((currentConversations) => {
      let updatedChats = currentConversations.filter((chat) => chat.id !== id);

      if (updatedChats.length === 0) {
        updatedChats = [{
          id: `chat-${window.crypto.randomUUID()}`,
          title: "New Chat",
          messages: [createWelcomeMessage(settings)],
        }];
      }

      if (activeChatId === id) setActiveChatId(updatedChats[0].id);
      saveConversations(updatedChats);
      return updatedChats;
    });

  }


  function renameChat(id, nextTitle) {
    const title = String(nextTitle || "").trim().slice(0, 100);
    if (!title) return false;

    setConversations((currentConversations) => {
      const updatedChats = currentConversations.map((chat) => (
        chat.id === id ? { ...chat, title } : chat
      ));
      saveConversations(updatedChats);
      return updatedChats;
    });
    return true;
  }


  function togglePinChat(id) {
    setConversations((currentConversations) => {
      const updatedChats = currentConversations.map((chat) => (
        chat.id === id ? { ...chat, pinned: !chat.pinned } : chat
      ));
      saveConversations(updatedChats);
      return updatedChats;
    });
  }


  function exportSingleChat(id) {
    const conversation = conversations.find((chat) => chat.id === id);
    if (conversation) exportConversation(conversation);
  }


  // ==========================================================
  // Clear All Chats
  // ==========================================================

  function clearAllChats() {

    Object.values(chatActivities).forEach((activity) => {
      if (activity.requestId) void cancelMessage(activity.requestId);
    });
    setChatActivities({});

    const firstChat = {

      id: `chat-${window.crypto.randomUUID()}`,

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


    setCurrentPage("chat");

  }


  function logout() {

    Object.values(chatActivities).forEach((activity) => {
      if (activity.requestId) void cancelMessage(activity.requestId);
    });
    setChatActivities({});

    resetSettings();
    navigate("/setup", { replace: true });

  }

  function replaceImportedChats(importedChats) {
    if (!Array.isArray(importedChats) || importedChats.length === 0) return;
    setConversations(importedChats);
    setActiveChatId(importedChats[0].id);
    setCurrentPage("chat");
  }


  // ==========================================================
  // Active Conversation
  // ==========================================================

  const activeConversation =
    conversations.find(
      (chat) =>
        chat.id === activeChatId
    ) || conversations[0];


  // ==========================================================
  // UI
  // ==========================================================

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

        onRenameChat={renameChat}

        onTogglePin={togglePinChat}

        onExportChat={exportSingleChat}

        chatActivities={chatActivities}

        onLogout={logout}

      />


      <div className="content">

        {/* ================================================== */}
        {/* Chat */}
        {/* ================================================== */}

{currentPage === "chat" &&
  activeConversation && (

    <Chat
      key={activeChatId}
      conversation={activeConversation}
      updateMessages={(messages) => updateMessages(activeChatId, messages)}
      activity={chatActivities[activeChatId]}
      updateActivity={(nextActivity) => updateChatActivity(activeChatId, nextActivity)}
      settings={settings}
    />

)}


        {/* ================================================== */}
        {/* Memory */}
        {/* ================================================== */}

        {currentPage === "memory" && (

          <Memory />

        )}


        {/* ================================================== */}
        {/* Settings */}
        {/* ================================================== */}

        {currentPage === "setting" && (

          <Setting

            onThemeChange={
              (theme) => {

                setSettings((currentSettings) => ({

                  ...currentSettings,

                  theme,

                }));

              }
            }

            onSettingsSaved={
              (updatedSettings) => {

                setSettings(
                  updatedSettings
                );

              }
            }

          />

        )}


        {/* ================================================== */}
        {/* Privacy */}
        {/* ================================================== */}

        {currentPage === "privacy" && (

          <Privacy

            onClearChats={
              clearAllChats
            }

            onSettingsChanged={
              setSettings
            }

            onConversationsImported={replaceImportedChats}

          />

        )}

      </div>

    </div>

  );

}


export default Dashboard;
