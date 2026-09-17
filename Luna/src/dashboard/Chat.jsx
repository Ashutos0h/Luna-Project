import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";

import "../styles/Chat.css";

import { cancelMessage, sendMessage } from "../services/chatService";

import {
  loadMemories,
} from "../services/memoryStorage";

import {
  readDocument,
} from "../services/documentService";
import { executeIntentActions } from "../services/intentActionService";

const starterActions = [
  {
    title: "Search the web",
    description: "Find current information and local recommendations",
    prompt: "Search the web for the latest AI news and summarize what matters.",
    icon: "search",
  },
  {
    title: "Work with a document",
    description: "Attach a PDF or TXT and ask questions about it",
    prompt: "Help me summarize a document. I will attach it next.",
    icon: "document",
  },
  {
    title: "Use my desktop",
    description: "Open apps, folders, websites, or type text safely",
    prompt: "Open Notepad and write Hello from Luna",
    icon: "desktop",
  },
  {
    title: "Think something through",
    description: "Plan, explain, write, compare, or brainstorm",
    prompt: "Help me turn a difficult goal into a clear step-by-step plan.",
    icon: "spark",
  },
];

function StarterIcon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    document: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    desktop: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    spark: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function createId(prefix) {
  return `${prefix}-${window.crypto.randomUUID()}`;
}


// ============================================================
// Chat Component
// ============================================================

function Chat({
  conversation,
  updateMessages,
  activity,
  updateActivity,
  settings,
  onTogglePin,
  onRenameChat,
  onExportChat,
  onDeleteChat,
}) {

  const messages = useMemo(
    () => conversation?.messages || [],
    [conversation?.messages]
  );


  const loading = Boolean(activity?.loading);
  const generating = Boolean(activity?.generating);
  const streamingText = activity?.streamingText || "";


  const [
    document,
    setDocument,
  ] = useState(null);


  const [
    documentMode,
    setDocumentMode,
  ] = useState(false);

  const [documentError, setDocumentError] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [renameText, setRenameText] = useState("");
  const isFreshConversation = !messages.some((message) => message.sender === "user");


  const bottomRef =
    useRef(null);

  const messagesContainerRef = useRef(null);
  const headerMenuRef = useRef(null);
  const headerRenameInputRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const pendingStreamTextRef = useRef("");
  const streamFlushTimerRef = useRef(null);

  useEffect(() => {
    if (!headerMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      try {
        if (
          headerMenuRef.current &&
          event.target &&
          typeof headerMenuRef.current.contains === "function" &&
          !headerMenuRef.current.contains(event.target)
        ) {
          setHeaderMenuOpen(false);
        }
      } catch (err) {
        console.warn("Click outside check failed:", err);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setHeaderMenuOpen(false);
    };

    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [headerMenuOpen]);

  useEffect(() => {
    if (editingTitle && headerRenameInputRef.current) {
      headerRenameInputRef.current.focus();
      headerRenameInputRef.current.select();
    }
  }, [editingTitle]);

  function submitHeaderRename(e) {
    if (e) e.preventDefault();
    const clean = String(renameText || "").trim();
    if (clean && clean !== conversation.title) {
      onRenameChat?.(conversation.id, clean);
    }
    setEditingTitle(false);
  }

  useEffect(() => () => {
    if (streamFlushTimerRef.current) {
      window.clearTimeout(streamFlushTimerRef.current);
    }
  }, []);

  function queueStreamChunk(requestId, delta) {
    pendingStreamTextRef.current += delta;
    if (streamFlushTimerRef.current) return;

    // Ollama can emit many tiny chunks per second. Updating React for every
    // token makes rich chat messages feel slower even when the model is fast.
    // 16ms = one animation frame at 60fps. Flushing every frame gives the
    // smoothest token-by-token streaming without overwhelming React's scheduler.
    streamFlushTimerRef.current = window.setTimeout(() => {
      const bufferedText = pendingStreamTextRef.current;
      pendingStreamTextRef.current = "";
      streamFlushTimerRef.current = null;

      if (!bufferedText) return;
      updateActivity((current) => (
        current.requestId === requestId
          ? { ...current, streamingText: current.streamingText + bufferedText }
          : current
      ));
    }, 16);
  }


  // ==============================
  // Auto Scroll
  // ==============================

  useEffect(() => {

    if (!shouldStickToBottomRef.current) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    if (streamingText) {
      container.scrollTop = container.scrollHeight;
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  }, [messages, streamingText]);


  function handleMessagesScroll() {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    shouldStickToBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }


  function handleMessagesWheel(event) {
    if (event.deltaY >= 0) return;
    shouldStickToBottomRef.current = false;
    setShowScrollButton(true);
  }


  function scrollToLatest() {
    shouldStickToBottomRef.current = true;
    setShowScrollButton(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }


  async function handleStopGeneration() {
    const activeRequestId = activity?.requestId;
    if (!activeRequestId) return;
    await cancelMessage(activeRequestId);
  }


  function isErrorResponse(text) {
    return /^(?:Unable to connect|Something went wrong|Ollama is installed but|The model is taking longer|The .+ model is not ready|The model returned an empty response)/i
      .test(String(text || "").trim());
  }


  async function generateAssistantResponse(text, baseMessages) {
    shouldStickToBottomRef.current = true;
    setShowScrollButton(false);
    pendingStreamTextRef.current = "";
    if (streamFlushTimerRef.current) {
      window.clearTimeout(streamFlushTimerRef.current);
      streamFlushTimerRef.current = null;
    }
    updateMessages(baseMessages);

    const requestId = createId("chat");
    updateActivity({
      loading: true,
      generating: true,
      streamingText: "",
      toolStatus: "",
      requestId,
    });

    try {
      let documentContext = "";

      if (document && documentMode) {
        documentContext = `
Document Name:
${document.name}

Document Content:
${document.content}
`;
      }

      const response = await sendMessage(
        text,
        documentContext,
        loadMemories(),
        settings?.aiModel || "qwen2.5:3b",
        baseMessages.slice(0, -1),
        {
          requestId,
          allowAutoMemory: settings?.autoMemory !== false,
          performanceMode: settings?.performanceMode || "fast",
          desktopControlEnabled: settings?.desktopControlEnabled === true,
          onChunk: (delta) => queueStreamChunk(requestId, delta),
        }
      );

      const executableActions = (response.actions || []).map((action) => (
        action.type === "generate_and_type"
          ? { ...action, text: String(action.text || response.text || "").trim() }
          : action
      ));
      const actionResults = await executeIntentActions(executableActions, (action) => {
        const isShell = /^(?:powershell|cmd|terminal|command prompt|bash)$/i.test(String(action.application || ""));
        const labels = {
          open_app: isShell ? "Processing in background…" : `Opening ${action.application}…`,
          open_app_and_type: isShell ? "Processing command in background…" : `Preparing to type in ${action.application}…`,
          generate_and_type: isShell ? "Processing command in background…" : `Writing in ${action.application}…`,
          open_app_and_search: `Opening ${action.application} search…`,
          search_in_application: `Searching ${action.application}…`,
          search_web: "Opening web search…",
          open_url: "Opening website…",
          open_folder: "Opening folder…",
          uacc_click_element: `Locating "${action.element}" on screen…`,
          uacc_type_text: "Typing in active window…",
          uacc_hotkey: `Pressing ${(action.keys || []).join(" + ")}…`,
          uacc_scroll: `Scrolling ${action.direction || "down"}…`,
          uacc_focus_window: `Switching to ${action.title}…`,
          save_memory: "Saving memory…",
        };
        updateActivity((current) => current.requestId === requestId
          ? { ...current, toolStatus: labels[action.type] || "Working…", streamingText: "" }
          : current);
      }, { desktopControlEnabled: settings?.desktopControlEnabled === true });
      const externalResults = actionResults.filter((result) => (
        result.type === "search_web" ||
        result.type === "open_app" ||
        result.type === "open_app_and_type" ||
        result.type === "generate_and_type" ||
        result.type === "open_app_and_search" ||
        result.type === "search_in_application" ||
        result.type === "open_url" ||
        result.type === "open_folder" ||
        result.type === "uacc_click_element" ||
        result.type === "uacc_type_text" ||
        result.type === "uacc_hotkey" ||
        result.type === "uacc_scroll" ||
        result.type === "uacc_focus_window"
      ));
      const memoryResults = actionResults.filter((result) => result.type === "save_memory");

      let reply = String(response.text || "").trim();

      const generatedWriteResults = externalResults.filter((result) => result.type === "generate_and_type");
      if (generatedWriteResults.length > 0) {
        const successfulWrites = generatedWriteResults.filter((result) => result.success && !result.cancelled);
        const failedWrites = generatedWriteResults.filter((result) => !result.success || result.cancelled);
        if (successfulWrites.length > 0) {
          // On success: show only the short status, not the generated content repeated
          reply = successfulWrites.map((result) => `*${result.message}*`).join("\n\n");
        } else {
          // On cancel/failure: keep the generated text so user can still see/copy it
          reply = [reply, ...failedWrites.map((result) => `*${result.message}*`)].filter(Boolean).join("\n\n");
        }
      } else if (externalResults.length > 0) {
        reply = externalResults.map((result) => result.message).join("\n\n");
      }

      if (memoryResults.some((result) => result.success)) {
        reply = [reply, "*Saved to Memory on this device.*"].filter(Boolean).join("\n\n");
      } else if (!reply && memoryResults.length > 0) {
        reply = memoryResults.map((result) => result.message).join("\n\n");
      }

      if (!reply) {
        reply = "The model returned an empty response. Please try again.";
      }

      const actionFailed = actionResults.some((result) => !result.success && !result.cancelled);
      const messageKind = externalResults.length > 0
        ? "action"
        : (!response.text && memoryResults.length > 0 ? "memory" : undefined);

      updateMessages([
        ...baseMessages,
        {
          id: createId("assistant"),
          sender: "assistant",
          text: reply,
          error: actionFailed || isErrorResponse(reply),
          kind: messageKind,
          intent: response.intent,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      updateMessages([
        ...baseMessages,
        {
          id: createId("assistant-error"),
          sender: "assistant",
          text: "Something went wrong while generating the response.",
          error: true,
        },
      ]);
    } finally {
      pendingStreamTextRef.current = "";
      if (streamFlushTimerRef.current) {
        window.clearTimeout(streamFlushTimerRef.current);
        streamFlushTimerRef.current = null;
      }
      updateActivity((current) => (
        current.requestId === requestId
          ? {
              ...current,
              loading: false,
              generating: false,
              streamingText: "",
              requestId: null,
              toolStatus: "",
            }
          : current
      ));
    }
  }


  async function handleRegenerate(messageId) {
    if (loading) return;
    const assistantIndex = messages.findIndex((message) => message.id === messageId);
    if (assistantIndex < 0) return;

    let userIndex = assistantIndex - 1;
    while (userIndex >= 0 && messages[userIndex].sender !== "user") userIndex--;
    if (userIndex < 0) return;

    await generateAssistantResponse(
      messages[userIndex].text,
      messages.slice(0, userIndex + 1)
    );
  }


  async function handleEditAndResend(messageId, nextText) {
    if (loading) return;
    const userIndex = messages.findIndex((message) => message.id === messageId);
    const text = String(nextText || "").trim();
    if (userIndex < 0 || messages[userIndex].sender !== "user" || !text) return;

    const editedUserMessage = {
      ...messages[userIndex],
      text,
      edited: true,
    };

    await generateAssistantResponse(
      text,
      [...messages.slice(0, userIndex), editedUserMessage]
    );
  }


  // ==============================
  // File Upload
  // ==============================

  async function handleFileSelect(
    file
  ) {

    try {

      const loadedDocument =
        await readDocument(file);

      setDocumentError("");


      setDocument(
        loadedDocument
      );


    } catch (error) {

      console.error(
        "File upload failed: " + error.message
      );

      setDocumentError(error.message || "The document could not be opened.");

    }

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

    shouldStickToBottomRef.current = true;
    setShowScrollButton(false);


    const userMessage = {
      id: createId("user"),
      sender: "user",
      text,
    };

    await generateAssistantResponse(text, [...messages, userMessage]);

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
        <div className="chat-heading">
          {editingTitle ? (
            <form className="chat-header-rename" onSubmit={submitHeaderRename}>
              <input
                ref={headerRenameInputRef}
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                onBlur={submitHeaderRename}
                maxLength={60}
                aria-label="Rename conversation"
                autoFocus
              />
              <button type="submit" className="rename-confirm-btn" title="Save title" aria-label="Save title">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button type="button" className="rename-cancel-btn" onClick={() => setEditingTitle(false)} title="Cancel" aria-label="Cancel">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </form>
          ) : (
            <h2>
              {conversation.pinned && (
                <span className="chat-pinned-icon" title="Pinned conversation" aria-label="Pinned">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
                  </svg>
                </span>
              )}
              <span className="chat-heading-text" title={conversation.title}>
                {isFreshConversation ? `Chat with ${settings?.assistantName || "Luna"}` : conversation.title}
              </span>
            </h2>
          )}
        </div>

        {!isFreshConversation && (
          <div className="chat-header-actions" ref={headerMenuRef}>
            <button
              type="button"
              className={`chat-header-menu-btn${headerMenuOpen ? " active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setHeaderMenuOpen((prev) => !prev);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Conversation actions"
              title="Conversation actions"
              aria-expanded={headerMenuOpen}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="12" cy="19" r="1.8" />
              </svg>
            </button>

            {headerMenuOpen && (
              <div
                className="chat-header-menu"
                role="menu"
                aria-label="Conversation actions"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    if (conversation?.id) onTogglePin?.(conversation.id);
                  }}
                  role="menuitem"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
                  </svg>
                  <span>{conversation?.pinned ? "Unpin conversation" : "Pin conversation"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setRenameText(conversation?.title || "");
                    setEditingTitle(true);
                  }}
                  role="menuitem"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16.5 3.5 4 4L7 19l-4 1 1-4z" />
                  </svg>
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    if (conversation?.id) onExportChat?.(conversation.id);
                  }}
                  role="menuitem"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export JSON</span>
                </button>

                <div className="chat-header-menu-divider" />

                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    if (conversation?.id) onDeleteChat?.(conversation.id);
                  }}
                  role="menuitem"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete conversation</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Messages */}

      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        onWheel={handleMessagesWheel}
      >

        {isFreshConversation && (
          <section className="chat-welcome" aria-labelledby="welcome-title">
            <div className="welcome-orb" aria-hidden="true">
              <span>L</span><i /><i />
            </div>
            <p className="welcome-eyebrow">Your private desktop intelligence</p>
            <h1 id="welcome-title">Good to see you, {settings?.userName || "there"}.</h1>
            <p className="welcome-copy">
              Ask a question, explore a document, search the web, or let {settings?.assistantName || "Luna"} help with your desktop.
            </p>
            <div className="starter-grid">
              {starterActions.map((action) => (
                <button key={action.title} type="button" onClick={() => handleSend(action.prompt)}>
                  <span className="starter-icon"><StarterIcon name={action.icon} /></span>
                  <span><strong>{action.title}</strong><small>{action.description}</small></span>
                  <svg className="starter-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              ))}
            </div>
          </section>
        )}

        {!isFreshConversation && messages.map(
          (message, index) => (

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

              assistantName={settings?.assistantName || "Luna"}

              error={Boolean(message.error)}

              edited={Boolean(message.edited)}

              actionsDisabled={loading}

              onEdit={message.sender === "user" && !messages[index + 1]?.kind
                ? (nextText) => handleEditAndResend(message.id, nextText)
                : undefined}

              onRegenerate={message.sender === "assistant" && !message.kind && messages
                .slice(0, index)
                .some((candidate) => candidate.sender === "user")
                ? () => handleRegenerate(message.id)
                : undefined}

              onRetry={message.sender === "assistant" && message.error
                ? () => handleRegenerate(message.id)
                : undefined}

            />

          )
        )}


        {streamingText && (

          <ChatBubble
            sender="assistant"
            text={streamingText}
            assistantName={settings?.assistantName || "Luna"}
            streaming
          />

        )}


        {loading && !streamingText && (

          <div className="typing-message" aria-live="polite">
            <span className="typing-avatar">{(settings?.assistantName || "L").charAt(0)}</span>
            <span>{activity?.toolStatus || `${settings?.assistantName || "Luna"} is thinking`}</span>
            <i /><i /><i />
          </div>

        )}


        <div
          ref={bottomRef}
        />

      </div>


      {showScrollButton && (

        <button
          type="button"
          className="scroll-to-latest"
          onClick={scrollToLatest}
        >
          <span aria-hidden="true">↓</span>
          Jump to latest
        </button>

      )}


      {/* Document */}

      {document && (

        <div className="chat-document">

          <div className="chat-document-info">

            {document.name}

            {document.truncated && (
              <span className="chat-document-note">First 60,000 characters loaded</span>
            )}

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

      {documentError && (
        <div className="chat-document-error" role="alert">
          <span>{documentError}</span>
          <button type="button" onClick={() => setDocumentError("")} aria-label="Dismiss document error">×</button>
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

        generating={
          generating
        }

        onStop={
          handleStopGeneration
        }

        settings={settings}

      />

    </div>

  );

}


export default Chat;
