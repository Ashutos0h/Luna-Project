import React from 'react'
import { useState } from 'react'

function MessageInput({onSend}){
    const [message, setMessage] = useState("");

    function handleSend(){
        if(!message.trim()) return;

        onSend(message);

        setMessage("")
    }
    function handleKeyDown(e){
            if(e.key ==="Enter"){
                sendMessage();
            }
    }

    return(
        <div className='message-input'>
            <input 
            type="text"
            placeholder='Type your message..'
            value={message}
            onChange={(e)=> setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            />

        <button onClick={sendMessage}>
            Send
        </button>


        </div>
    );
}

export default MessageInput;