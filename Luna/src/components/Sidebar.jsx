
import "../styles/Sidebar.css";

function Sidebar({

    conversations,
    activeChatId,
    onSelectConversation,
    onNewChat
}){
    return(
<div className ="sidebar">

    <h2> Luna</h2>

    <button className="new-chat-btn"
    onClick={onNewChat}>
        New Chat
    </button>

    <h3> History</h3>

    {conversations.map((chat)=>(
        <div
        key = {chat.id}

            className = {
                activeChatId===chat.id
                ? "chat-item active"
                : "chat-item"
            }

            onClick = {()=> 
            onSelectConversation(chat)
            }
        >
            {chat.title}
        </div>
    ))}
</div>

    );
}

export default Sidebar;