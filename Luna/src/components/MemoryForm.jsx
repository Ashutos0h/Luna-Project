import { useState, useEffect } from "react";

function MemoryForm({
  onSave,
  editingMemory,
}) {

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {

    if (editingMemory) {

      setTitle(editingMemory.title);

      setValue(editingMemory.value);

    }

  }, [editingMemory]);

  function handleSubmit(e) {

    e.preventDefault();

    if (!title.trim() || !value.trim()) {
      return;
    }

    onSave({
      id: editingMemory
        ? editingMemory.id
        : Date.now(),
      title,
      value,
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
      />

      <input
        type="text"
        placeholder="Memory Value"
        value={value}
        onChange={(e) =>
          setValue(e.target.value)
        }
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