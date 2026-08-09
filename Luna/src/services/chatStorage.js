export const STORAGE_KEY = "luna_conversations";

export function loadConversations() {
  const data = localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveConversations(conversations) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(conversations)
  );
}

export function clearConversations(){
  localStorage.removeItem(STORAGE_KEY);
}

//Export Conversations

// Export Conversations
export function exportConversations() {

    const conversations = loadConversations();

    const json = JSON.stringify(conversations, null, 2);

    const blob = new Blob([json], {type: "application/json",});

    // Generating URL for Blob : browser needs an actual href address to download something.
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "luna_conversations.json";

    link.click();

    URL.revokeObjectURL(url);

}