function MemoryCard({
  memory,
  onEdit,
  onDelete,
}) {
  return (

    <div className="memory-card">

      <div className="memory-card-heading">
        <h3>{memory.title}</h3>
        {memory.source === "assistant" && <span>Auto-saved</span>}
      </div>

      <p>{memory.value}</p>

      <div className="memory-buttons">

        <button
          onClick={() => onEdit(memory)}
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(memory.id)}
        >
          Delete
        </button>

      </div>

    </div>

  );
}

export default MemoryCard;
