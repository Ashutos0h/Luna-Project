import { useState } from "react";
import "../styles/Privacy.css";
import { clearMemory } from "../services/memoryStorage";
import { resetSettings } from "../services/settingsStorage";
import { clearConversations, exportConversations, importConversations } from "../services/chatStorage";
import { useNavigate } from "react-router-dom";

function Privacy({ onClearChats }) {

  const [notification, setNotification] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const navigate = useNavigate();

  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => {
      setNotification("");
    }, 3000);
  }

  function handleClearChats() {
    setConfirmModal({
      type: "chats",
      title: "Clear All Conversations?",
      message: "Are you sure you want to delete all conversations? This action cannot be undone.",
    });
  }

  function handleClearMemory() {
    setConfirmModal({
      type: "memories",
      title: "Clear All Memories?",
      message: "Are you sure you want to clear all stored memories?",
    });
  }

  function handleResetLuna() {
    setConfirmModal({
      type: "reset",
      title: "Reset Luna?",
      message: "This will delete all conversations, memories, and settings and return Luna to initial setup.",
    });
  }

  function handleConfirmAction() {
    if (!confirmModal) return;
    const actionType = confirmModal.type;
    setConfirmModal(null);

    if (actionType === "chats") {
      onClearChats();
    } else if (actionType === "memories") {
      clearMemory();
      showNotification("All memories have been cleared.");
    } else if (actionType === "reset") {
      resetSettings();
      clearMemory();
      clearConversations();
      navigate("/setup");
    }
  }

  function handleExportChats() {
    exportConversations();
    showNotification("Conversations exported successfully.");
  }

  async function handleImportChats(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await importConversations(file);
      showNotification("Conversations imported successfully.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      showNotification("Invalid JSON file.");
    }
  }

  return (

    <div className="privacy-container">

      <h1>Privacy & Data</h1>

      {notification && (
        <div className="privacy-toast">
          {notification}
        </div>
      )}

      {confirmModal && (
        <div className="confirm-overlay" onClick={() => setConfirmModal(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{confirmModal.title}</h2>
            <p>{confirmModal.message}</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-danger-btn"
                onClick={handleConfirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="privacy-intro">
        Luna is designed to protect your privacy.
        All your information remains on your device.
      </p>

      <div className="privacy-card">

        <h2>Stored Locally</h2>

        <ul>

          <li>Conversations</li>
          
          <li>Memories</li>
 
          <li>Settings</li>

        </ul>

      </div>

      <div className="privacy-card">

        <h2>AI Processing</h2>

        <p>

          Luna communicates with your locally running
          Ollama model.

          Your conversations are processed on your own
          computer.

        </p>

      </div>

      <div className="privacy-card">

        <h2>Cloud Storage</h2>

        <p>

          Luna does not upload your conversations,
          memories or settings to any cloud server.

        </p>

      </div>

{/* // Clear Chats Button */}
      <div className="privacy-card">

        <h2>Your Control</h2>

        <p>

          You have complete control over your data.


        </p>
        <button className="danger-btn"
        onClick={handleClearChats}
        >
          Clear All Conversations
        </button>

      </div>



      {/* // Clear Memory Button  */}

      <div className="privacy-card">

    <h2>Memory</h2>

    <p>
        Luna stores important information in memory to provide a better
        experience. You can remove all stored memories at any time.
    </p>

    <button
        className="danger-btn"
        onClick={handleClearMemory}
    >
        Clear All Memories
    </button>

</div>


      {/* // Reset Luna Button  */}

      <div className="privacy-card">

  <h2>Reset Luna</h2>

  <p>

    Reset Luna to its initial setup.
    This deletes all conversations,
    memories and settings.

  </p>

  <button
    className="danger-btn"
    onClick={handleResetLuna}
  >

    Reset Luna

  </button>

</div>



{/* Export Button */}
<div className="privacy-card">

    <h2>Export Conversations</h2>

    <p>Download all conversations as a JSON backup. </p>

    <button
        className="primary-btn"
        onClick={handleExportChats} >
        Export
    </button>

</div>

{/* Input Option */}

<div className="privacy-card">

    <h2>Import Conversations</h2>

    <p>Restore conversations from a backup.</p>

    <input
        type="file"

        accept=".json"

        onChange={handleImportChats}
    />

</div>





    </div>

  );

}

export default Privacy;