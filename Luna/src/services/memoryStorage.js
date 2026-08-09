const MEMORY_KEY ="luna_memories";

//load all memories

export function loadMemories(){
    const data = localStorage.getItem(MEMORY_KEY);

    if(!data){
        return [];
    }

    return JSON.parse(data);
}

// save all memories

export function saveMemories(memories) {
  localStorage.setItem(
  MEMORY_KEY,
    JSON.stringify(memories)
  );
}

// Add new Memory

export function addMemory(memory){
    const memories = loadMemories();
    
    memories.push(memory);

    saveMemories(memories); 
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
  const memories = loadMemories().map(memory =>
    memory.id === updatedMemory.id
      ? updatedMemory
      : memory
  );

  saveMemories(memories);
}

//Clear Memory

export function clearMemory(){
  localStorage.removeItem(MEMORY_KEY);
}