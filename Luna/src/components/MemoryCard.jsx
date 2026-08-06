function MemoryCard({
  memory,
  onEdit,
  onDelete,
}) {
  return (

    <div className="memory-card">

      <h3>{memory.title}</h3>

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