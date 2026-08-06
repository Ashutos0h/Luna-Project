const STORAGE_KEY = "luna_conversations";

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