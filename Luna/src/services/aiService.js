export async function sendMessage(message) {
  return await window.electronAPI.sendMessage(message);
}