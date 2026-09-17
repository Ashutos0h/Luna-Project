import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { loadSettings, resetSettings } from "../services/settingsStorage";

import Sidebar from "./Sidebar";
import Chat from "./Chat";
import ErrorBoundary from "../components/ErrorBoundary";

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

    // If the currently active chat is already empty (no user messages),
    // simply navigate to it instead of spawning another blank chat.
    const activeChat = conversations.find((c) => c.id === activeChatId);
    const activeHasUserMessages = activeChat?.messages?.some(
      (m) => m.sender === "user"
    );

    if (!activeHasUserMessages && activeChat) {
      setActiveChatId(activeChat.id);
      setCurrentPage("chat");
      return;
    }

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

  }, [settings, conversations, activeChatId]);


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


function isGenericTitle(title) {
  const t = String(title || "").trim().toLowerCase();
  if (!t || t === "new chat" || t === "untitled conversation" || t === "conversation") return true;
  if (/^(hi|hello|hey|greetings|welcome|how are you|good morning|good evening|test|ping)[.!?…]*$/i.test(t)) return true;
  if (/^(hi|hello|hey)\s+(there|luna|kabira|assistant|bot)[.!?…]*$/i.test(t)) return true;
  if (/^(welcome inquiry|general inquiry|chat with luna|chat)[.!?…]*$/i.test(t)) return true;
  return false;
}

  // ==========================================================
  // Update Messages
  // ==========================================================

  async function updateMessages(chatId, messages) {

    setConversations((currentConversations) => {
      const updatedChats = currentConversations.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          updatedAt: Date.now(),
          messages,
        };
      });
      saveConversations(updatedChats);
      return updatedChats;
    });

    const userMessages = messages.filter((m) => m.sender === "user" && m.text?.trim());
    const assistantMessages = messages.filter((m) => m.sender === "assistant" && m.text?.trim());

    if (userMessages.length < 1 || assistantMessages.length < 1) return;

    // Check target chat
    const targetChat = conversations.find((c) => c.id === chatId);
    if (!targetChat || targetChat.customTitle) return;

    // Dynamically update/refine title according to whole chat if generic or early turns
    const isCurrentTitleGeneric = isGenericTitle(targetChat.title);
    const shouldRefineTitle = isCurrentTitleGeneric || userMessages.length <= 3;
    if (!shouldRefineTitle) return;

    const meaningfulMessages = messages
      .filter((m) => m.id !== "welcome-message" && !m.isWelcome && (m.sender === "user" || m.sender === "assistant"))
      .map((m) => ({ sender: m.sender, text: String(m.text || "").trim() }));

    try {
      if (window.electronAPI?.generateChatTitle) {
        const result = await window.electronAPI.generateChatTitle({
          messages: meaningfulMessages.slice(-6),
          userMessage: userMessages[userMessages.length - 1].text,
          assistantMessage: assistantMessages[assistantMessages.length - 1].text,
          model: settings.aiModel || "qwen2.5:3b",
        });

        if (result?.success && result.title && !isGenericTitle(result.title)) {
          setConversations((currentConversations) => {
            const updatedChats = currentConversations.map((chat) =>
              chat.id === chatId && !chat.customTitle
                ? { ...chat, title: result.title }
                : chat
            );
            saveConversations(updatedChats);
            return updatedChats;
          });
          return;
        }
      }
    } catch {
      // Fall through to smart fallback below
    }

    // Smart substantive fallback: pick the meaningful user request
    const substantiveUserMsg = userMessages.find(
      (m) => !/^(hi|hello|hey|greetings|good morning|good evening|test|ping)[.!?\s]*$/i.test(m.text.trim())
    );
    if (substantiveUserMsg) {
      const cleaned = substantiveUserMsg.text
        .trim()
        .replace(/^(hey|hi|hello)\s*[,.]?\s*/i, "")
        .replace(/^(can\s+you\s+(please\s+)?(help\s+me\s+(with|to)\s+|generate\s+|write\s+|show\s+|tell\s+me\s+)?)/i, "")
        .replace(/^(please\s+|tell\s+me\s+(all\s+)?|what\s+is\s+|who\s+is\s+)/i, "");

      const words = cleaned.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
      if (words.length > 0) {
        const fallbackTitle = words
          .slice(0, 5)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") + (words.length > 5 ? "…" : "");

        setConversations((currentConversations) => {
          const updatedChats = currentConversations.map((chat) =>
            chat.id === chatId && !chat.customTitle && isGenericTitle(chat.title)
              ? { ...chat, title: fallbackTitle }
              : chat
          );
          saveConversations(updatedChats);
          return updatedChats;
        });
      }
    }

  }


  function updateChatActivity(chatId, nextActivity) {
    setChatActivities((currentActivities) => {
      const currentActivity = currentActivities[chatId] || {
        loading: false,
        generating: false,
        streamingText: "",
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
      if (!currentActivities[chatId]) return currentActivities;
      const nextActivities = { ...currentActivities };
      delete nextActivities[chatId];
      return nextActivities;
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
        chat.id === id ? { ...chat, title, customTitle: true } : chat
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

        {currentPage === "chat" && (
          activeConversation ? (
            <ErrorBoundary key={activeChatId || "default-chat"} onReset={() => createNewChat()}>
              <Chat
                key={activeChatId}
                conversation={activeConversation}
                updateMessages={(messages) => updateMessages(activeChatId, messages)}
                activity={chatActivities[activeChatId]}
                updateActivity={(nextActivity) => updateChatActivity(activeChatId, nextActivity)}
                settings={settings}
                onTogglePin={togglePinChat}
                onRenameChat={renameChat}
                onExportChat={exportSingleChat}
                onDeleteChat={deleteChat}
              />
            </ErrorBoundary>
          ) : (
            <div className="chat-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="chat-welcome">
                <h2>No conversation selected</h2>
                <button type="button" className="new-chat-btn" onClick={createNewChat} style={{ marginTop: "16px" }}>
                  Start New Chat
                </button>
              </div>
            </div>
          )
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
