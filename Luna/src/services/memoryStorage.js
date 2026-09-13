const MEMORY_KEY ="luna_memories";
const MAX_MEMORIES = 250;

function normalizeMemory(memory) {
  if (!memory || typeof memory !== "object") return null;
  const value = String(memory.value || "").trim().slice(0, 2000);
  if (!value) return null;

  return {
    id: String(memory.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`),
    title: String(memory.title || "User Memory").trim().slice(0, 100) || "User Memory",
    value,
    source: memory.source === "assistant" ? "assistant" : "manual",
    createdAt: Number(memory.createdAt) || Date.now(),
  };
}

//load all memories

export function loadMemories(){
    const data = localStorage.getItem(MEMORY_KEY);

    if(!data){
        return [];
    }

    try {
        const memories = JSON.parse(data);
        return Array.isArray(memories)
          ? memories.map(normalizeMemory).filter(Boolean).slice(-MAX_MEMORIES)
          : [];
    } catch (error) {
        console.error("Error loading memories:", error);
        return [];
    }
}

// save all memories

export function saveMemories(memories) {
  try {
    const normalized = (Array.isArray(memories) ? memories : [])
      .map(normalizeMemory)
      .filter(Boolean)
      .slice(-MAX_MEMORIES);
    localStorage.setItem(MEMORY_KEY, JSON.stringify(normalized));
    return true;
  } catch (error) {
    console.error("Unable to save memories:", error);
    return false;
  }
}

// Add new Memory

export function addMemory(memory){
    const memories = loadMemories();

    const normalizedMemory = normalizeMemory(memory);
    const value = normalizedMemory?.value || "";

    if (!value) {
      return false;
    }

    const alreadySaved = memories.some(
      (item) => String(item.value || "").trim().toLowerCase() === value.toLowerCase()
    );

    if (alreadySaved) {
      return true;
    }

    memories.push(normalizedMemory);

    return saveMemories(memories);
    }

// Delete memory
export function deleteMemory(id) {
  const memories = loadMemories().filter(
    memory => memory.id !== id
  );

  saveMemories(memories);
}

// Update memory
export function updateMemory(updatedMemory) {
  const normalizedMemory = normalizeMemory(updatedMemory);
  if (!normalizedMemory) return false;
  const memories = loadMemories().map(memory =>
    memory.id === normalizedMemory.id
      ? normalizedMemory
      : memory
  );

  return saveMemories(memories);
}

//Clear Memory

export function clearMemory(){
  localStorage.removeItem(MEMORY_KEY);
}
