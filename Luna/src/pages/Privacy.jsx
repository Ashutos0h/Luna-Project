import "../styles/Privacy.css";
import { clearMemory } from "../services/memoryStorage";
import { resetSettings } from "../services/settingsStorage";
import { clearConversations } from "../services/chatStorage";
import { exportConversations } from "../services/chatStorage";

import {useNavigate} from "react-router-dom";

function Privacy({onClearChats}) {

  // Clear function Making
function handleClearChats() {
  console.log("Button Clicked")
  const confirmDelete = window.confirm("Are you sure you want to delete all conversations?");
  
  if (!confirmDelete) {
    return;
  }
  console.log("Calling Dashboard")
  onClearChats();

}

// Clear Memory Function
function handleClearMemory(){
  const confirmDelete = window.confirm("Are you sure you want to clear all memories?");

  if(!confirmDelete){
    return;
  }

  clearMemory();
  alert("All memories have been cleared.");
}

// Reset Luna Function

const navigate = useNavigate();

function handleResetLuna(){
  const confirmReset = window.confirm("This will delete all chats, memories and settings.\n\nContinue?");

  if(!confirmReset){
    return;
  }

  resetSettings();
  clearMemory();
  clearConversations();

  navigate("/setup");
}

// Handle Export Chats
function handleExportChats(){
  exportConversations();
}


  return (

    <div className="privacy-container">

      <h1>🔒 Privacy & Data</h1>

      <p className="privacy-intro">
        Luna is designed to protect your privacy.
        All your information remains on your device.
      </p>

      <div className="privacy-card">

        <h2>📁 Stored Locally</h2>

        <ul>

          <li>💬 Conversations</li>

          
          <li>🧠 Memories</li>
 
          <li>⚙️ Settings</li>

        </ul>

      </div>

      <div className="privacy-card">

        <h2>🤖 AI Processing</h2>

        <p>

          Luna communicates with your locally running
          Ollama model.

          Your conversations are processed on your own
          computer.

        </p>

      </div>

      <div className="privacy-card">

        <h2>☁ Cloud Storage</h2>

        <p>

          Luna does not upload your conversations,
          memories or settings to any cloud server.

        </p>

      </div>

{/* // Clear Chats Button */}
      <div className="privacy-card">

        <h2>🔐 Your Control</h2>

        <p>

          You have complete control over your data.


        </p>
        <button className="danger-btn"
        onClick={handleClearChats}
        >
          🗑 Clear All Conversations
        </button>

      </div>



      {/* // Clear Memory Button  */}

      <div className="privacy-card">

    <h2>🧠 Memory</h2>

    <p>
        Luna stores important information in memory to provide a better
        experience. You can remove all stored memories at any time.
    </p>

    <button
        className="danger-btn"
        onClick={handleClearMemory}
    >
        🧠 Clear All Memories
    </button>

</div>


      {/* // Reset Luna Button  */}

      <div className="privacy-card">

  <h2>♻ Reset Luna</h2>

  <p>

    Reset Luna to its initial setup.
    This deletes all conversations,
    memories and settings.

  </p>

  <button
    className="danger-btn"
    onClick={handleResetLuna}
  >

    ♻ Reset Luna

  </button>

</div>



{/* Export Button */}
<div className="privacy-card">

    <h2>📤 Export Conversations</h2>

    <p>

        Download all conversations
        as a JSON backup.

    </p>

    <button
        className="primary-btn"
        onClick={handleExportChats}
    >

        📤 Export

    </button>

</div>



    </div>

  );

}

export default Privacy;