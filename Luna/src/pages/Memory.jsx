import { useState } from "react";

import MemoryCard from "../components/MemoryCard";
import MemoryForm from "../components/MemoryForm";

import {
  loadMemories,
  saveMemories,
} from "../services/memoryStorage";

import "../styles/Memory.css";


function Memory() {

  const [memories, setMemories] =
    useState(() => loadMemories());

  const [editingMemory, setEditingMemory] =
    useState(null);


  // ------------------------
  // Save or Update Memory
  // ------------------------

  function handleSave(memory) {

    let updatedMemories;

    const exists =
      memories.some(
        item => item.id === memory.id
      );


    if (exists) {

      updatedMemories =
        memories.map(item =>
          item.id === memory.id
            ? memory
            : item
        );

    } else {

      updatedMemories = [
        ...memories,
        memory,
      ];

    }


    setMemories(updatedMemories);

    saveMemories(updatedMemories);

    setEditingMemory(null);

  }


  // ------------------------
  // Delete Memory
  // ------------------------

  function handleDelete(id) {

    const updated =
      memories.filter(
        memory => memory.id !== id
      );


    setMemories(updated);

    saveMemories(updated);

  }


  // ------------------------
  // Edit Memory
  // ------------------------

  function handleEdit(memory) {

    setEditingMemory(memory);

  }


  return (

    <div className="memory-page">

      <h1>Memory</h1>


      <MemoryForm

        key={
          editingMemory?.id ?? "new"
        }

        onSave={handleSave}

        editingMemory={
          editingMemory
        }

      />


      <div className="memory-list">

        {memories.length === 0 ? (

          <p>
            No memories saved yet.
          </p>

        ) : (

          memories.map(memory => (

            <MemoryCard

              key={memory.id}

              memory={memory}

              onEdit={handleEdit}

              onDelete={handleDelete}

            />

          ))

        )}

      </div>

    </div>

  );

}


export default Memory;