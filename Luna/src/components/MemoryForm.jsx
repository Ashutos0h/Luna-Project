import { useState } from "react";

function MemoryForm({
  onSave,
  editingMemory,
}) {

  const [title, setTitle] = useState(
    editingMemory?.title || ""
  );

  const [value, setValue] = useState(
    editingMemory?.value || ""
  );


  function handleSubmit(e) {

    e.preventDefault();

    if (
      !title.trim() ||
      !value.trim()
    ) {
      return;
    }


    onSave({

      id: editingMemory
        ? editingMemory.id
        : `memory-${window.crypto.randomUUID()}`,

      title: title.trim(),

      value: value.trim(),

      source: editingMemory?.source || "manual",

      createdAt: editingMemory?.createdAt || Date.now(),

    });


    setTitle("");

    setValue("");

  }


  return (

    <form
      className="memory-form"
      onSubmit={handleSubmit}
    >

      <input
        type="text"
        placeholder="Memory Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        maxLength={100}
      />

      <input
        type="text"
        placeholder="Memory Value"
        value={value}
        onChange={(e) =>
          setValue(e.target.value)
        }
        maxLength={2000}
      />

      <button type="submit">

        {editingMemory
          ? "Update Memory"
          : "Add Memory"}

      </button>

    </form>

  );

}

export default MemoryForm;
