import "../styles/Sidebar.css";

function Sidebar({
  currentPage,
  setCurrentPage,
  settings,
  conversations,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}){
  return (
    <div className="sidebar">

      {/* Logo */}
     <h1 className="logo"> 🌙 {settings.assistantName}</h1>

     <p className="user-name">
    Welcome, {settings.userName}
</p>

      {/* New Chat Button */}
      <button
        className="new-chat-btn"
        onClick={onNewChat}
      >
        + New Chat
      </button>

      {/* Navigation */}
      <div className="sidebar-menu">

        <button
          className={
            currentPage === "chat"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setCurrentPage("chat")}
        >
          💬 Chat
        </button>

        <button
          className={
            currentPage === "memory"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setCurrentPage("memory")}
        >
          🧠 Memory
        </button>

        <button
          className={
            currentPage === "setting"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setCurrentPage("setting")}
        >
          ⚙️ Settings
        </button>

        <button
          className={
            currentPage === "privacy"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => setCurrentPage("privacy")}
        >
          🔒 Privacy
        </button>

      </div>

      {/* Conversation History */}
      <div className="history-section">

        <h3>History</h3>

        {conversations.length === 0 ? (

          <p className="empty-history">
            No conversations yet
          </p>

        ) : (

          conversations.map((chat) => (

            <div
              key={chat.id}
              className={
                activeChatId === chat.id
                  ? "conversation-item active"
                  : "conversation-item"
              }
            >

              <span
                className="chat-title"
                onClick={() => onSelectChat(chat.id)}
              >
                {chat.title}
              </span>

              <button
                className="delete-btn"
                onClick={() => onDeleteChat(chat.id)}
              >
                ✕
              </button>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Sidebar;