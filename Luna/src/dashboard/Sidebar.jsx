import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "../styles/Sidebar.css";
import lunaIcon from "../assets/luna-app-icon.ico";

const profileNavigation = [
  { id: "memory", label: "Memory", icon: "memory" },
  { id: "setting", label: "Settings", icon: "settings" },
  { id: "privacy", label: "Privacy", icon: "privacy" },
];

function chatGroup(chat) {
  if (chat.pinned) return "Pinned";
  if (!chat.messages?.some((message) => message.sender === "user")) return "Today";
  const timestamp = Number(chat.updatedAt) || Number(chat.id) || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (timestamp >= today.getTime()) return "Today";
  if (timestamp >= yesterday.getTime()) return "Yesterday";
  return "Earlier";
}

function NavIcon({ name }) {
  const paths = {
    compose: <><path d="M12 20H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" /><path d="m16.5 3.5 4 4L12 16l-4 1 1-4z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    memory: <><path d="M9 4.5A2.5 2.5 0 0 1 14 5v14a3 3 0 0 1-6 0V6.5a2 2 0 0 1 4 0V18" /><path d="M14 7a2.5 2.5 0 0 1 5 0v10a3 3 0 0 1-5.8 1" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" /></>,
    privacy: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Sidebar({
  currentPage,
  setCurrentPage,
  settings,
  conversations,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onExportChat,
  chatActivities,
  onLogout,
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuChatId, setMenuChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...conversations]
      .filter((chat) => {
        if (!normalizedQuery) return true;
        if (String(chat.title || "").toLowerCase().includes(normalizedQuery)) return true;
        return chat.messages?.some((message) => (
          String(message.text || "").toLowerCase().includes(normalizedQuery)
        ));
      })
      .sort((first, second) => {
        if (Boolean(first.pinned) !== Boolean(second.pinned)) {
          return first.pinned ? -1 : 1;
        }
        const groupOrder = { Pinned: 0, Today: 1, Yesterday: 2, Earlier: 3 };
        return groupOrder[chatGroup(first)] - groupOrder[chatGroup(second)] ||
          (Number(second.updatedAt) || Number(second.id) || 0) - (Number(first.updatedAt) || Number(first.id) || 0);
      });
  }, [conversations, searchQuery]);

  function beginRename(chat) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setMenuChatId(null);
  }

  function submitRename(event) {
    event.preventDefault();
    if (onRenameChat(editingChatId, editingTitle)) {
      setEditingChatId(null);
      setEditingTitle("");
    }
  }

  useEffect(() => {
    if (!logoutOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLogoutOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [logoutOpen]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeProfileMenu = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        return;
      }

      if (event.type === "mousedown" && !profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", closeProfileMenu);
    document.addEventListener("mousedown", closeProfileMenu);
    return () => {
      window.removeEventListener("keydown", closeProfileMenu);
      document.removeEventListener("mousedown", closeProfileMenu);
    };
  }, [profileOpen]);

  function openProfilePage(page) {
    setCurrentPage(page);
    setProfileOpen(false);
  }

  function startNewChat() {
    setSearchQuery("");
    setSearchOpen(false);
    onNewChat();
  }

  function openChatSearch() {
    setCollapsed(false);
    setSearchOpen(true);
    setCurrentPage("chat");
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="brand-block">
        <div className="brand-mark"><img src={lunaIcon} alt="" /></div>
        <div className="brand-copy">
          <h1 className="logo">{settings.assistantName}</h1>
        </div>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => {
            setCollapsed((value) => !value);
            setProfileOpen(false);
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="4" width="17" height="16" rx="3" />
            <path d="M9 4v16" />
          </svg>
        </button>
      </div>

      <div className="sidebar-primary-actions">
        <button className="new-chat-btn" onClick={startNewChat} aria-label="New chat" title="New chat (Ctrl+N)">
          <NavIcon name="compose" />
          <span>New chat</span>
        </button>
        <button
          type="button"
          className={`search-chats-button${searchOpen ? " active" : ""}`}
          onClick={openChatSearch}
          aria-expanded={searchOpen}
          aria-controls="conversation-search"
          title="Search chats"
        >
          <NavIcon name="search" />
          <span>Search chats</span>
        </button>
      </div>

      {(searchOpen || searchQuery) && (
        <div className="conversation-search" id="conversation-search">
          <NavIcon name="search" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(false);
            }}
            aria-label="Close search"
            title="Close search"
          >×</button>
        </div>
      )}

      <div className="history-section">
        <div className="history-heading">
          <p className="sidebar-label">Recent chats</p>
          <span>{conversations.length}</span>
        </div>
        {conversations.length === 0 ? (
          <p className="empty-history">Your conversations will appear here.</p>
        ) : visibleConversations.length === 0 ? (
          <p className="empty-history">No conversations match “{searchQuery}”.</p>
        ) : visibleConversations.map((chat, index) => (
          <Fragment key={chat.id}>
          {(index === 0 || chatGroup(chat) !== chatGroup(visibleConversations[index - 1])) && (
            <h3 className="chat-group-label">{chatGroup(chat)}</h3>
          )}
          <div key={chat.id} className={activeChatId === chat.id ? "conversation-item active" : "conversation-item"}>
            {editingChatId === chat.id ? (
              <form className="conversation-rename" onSubmit={submitRename}>
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setEditingChatId(null);
                  }}
                  maxLength={100}
                  aria-label="Conversation name"
                />
                <button type="submit" title="Save name" aria-label="Save conversation name">✓</button>
                <button type="button" onClick={() => setEditingChatId(null)} title="Cancel rename" aria-label="Cancel rename">×</button>
              </form>
            ) : (
              <>
                <button
                  className="chat-title"
                  onClick={() => {
                    onSelectChat(chat.id);
                    setMenuChatId(null);
                  }}
                  title={chat.title}
                >
                  <span className={chat.pinned ? "conversation-pin" : "conversation-dot"}>{chat.pinned ? "★" : ""}</span>
                  <span className="chat-title-text">{chat.title}</span>
                  {chatActivities?.[chat.id]?.generating && (
                    <span className="conversation-generating" title="Generating response" aria-label="Generating response">
                      <i /><i /><i />
                    </span>
                  )}
                </button>
                <button
                  className="conversation-menu-button"
                  onClick={() => setMenuChatId(menuChatId === chat.id ? null : chat.id)}
                  title="Conversation actions"
                  aria-label={`Actions for ${chat.title}`}
                  aria-expanded={menuChatId === chat.id}
                >•••</button>
                {menuChatId === chat.id && (
                  <div className="conversation-menu" role="menu">
                    <button type="button" onClick={() => { onTogglePin(chat.id); setMenuChatId(null); }} role="menuitem">
                      {chat.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" onClick={() => beginRename(chat)} role="menuitem">Rename</button>
                    <button type="button" onClick={() => { onExportChat(chat.id); setMenuChatId(null); }} role="menuitem">Export JSON</button>
                    <button className="danger" type="button" onClick={() => { onDeleteChat(chat.id); setMenuChatId(null); }} role="menuitem">Delete</button>
                  </div>
                )}
              </>
            )}
          </div>
          </Fragment>
        ))}
      </div>

      <div className="sidebar-profile-wrap" ref={profileMenuRef}>
        {profileOpen && (
          <div className="profile-menu" role="menu" aria-label="Profile and preferences">
            <div className="profile-menu-heading">
              <strong>{settings.userName || "User"}</strong>
              <span>Profile &amp; preferences</span>
            </div>
            {profileNavigation.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`profile-menu-item${currentPage === item.id ? " active" : ""}`}
                onClick={() => openProfilePage(item.id)}
                role="menuitem"
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="profile-menu-divider" />
            <button
              type="button"
              className="profile-menu-item danger"
              onClick={() => {
                setProfileOpen(false);
                setLogoutOpen(true);
              }}
              role="menuitem"
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className={`sidebar-profile${profileOpen ? " active" : ""}`}
          onClick={() => setProfileOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          <span className="profile-avatar">{(settings.userName || "U").charAt(0).toUpperCase()}</span>
          <span className="sidebar-profile-copy"><strong>{settings.userName || "User"}</strong><span>{settings.profession || "Luna user"}</span></span>
          <svg className="profile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m7 15 5-5 5 5" />
          </svg>
        </button>
      </div>

      {logoutOpen && (
        <div className="logout-overlay" onMouseDown={() => setLogoutOpen(false)}>
          <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="logout-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              </svg>
            </div>
            <h2 id="logout-title">Log out of Luna?</h2>
            <p>You’ll return to Setup. Your conversations and memories will remain safely stored on this device.</p>
            <div className="logout-actions">
              <button type="button" className="logout-cancel" onClick={() => setLogoutOpen(false)}>Cancel</button>
              <button type="button" className="logout-confirm" onClick={onLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
