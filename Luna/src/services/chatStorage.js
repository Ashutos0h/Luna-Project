const STORAGE_KEY = "luna_conversations";

// Load all conversations
export function loadConversations() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

// Save all conversations
export function saveConversations(conversations) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(conversations)
  );
}