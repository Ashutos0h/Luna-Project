import "../styles/ChatBubble.css";


function ChatBubble({ sender, text }) {

  return (

    <div
      className={`chat-bubble ${
        sender === "user"
          ? "user"
          : "assistant"
      }`}
    >

      <p>{text}</p>

    </div>

  );

}


export default ChatBubble;