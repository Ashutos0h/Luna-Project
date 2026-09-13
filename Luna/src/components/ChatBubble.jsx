import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/ChatBubble.css";


function getNodeText(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  return getNodeText(node?.props?.children);
}

function CopyableCodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const code = getNodeText(children).replace(/\n$/, "");

  async function copyCode() {
    try {
      if (window.electronAPI?.copyText) await window.electronAPI.copyText(code);
      else await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Could not copy code:", error);
    }
  }

  return (
    <div className="code-block">
      <button type="button" onClick={copyCode} className="copy-code-button">
        {copied ? "Copied" : "Copy code"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

function ChatBubble({
  sender,
  text,
  assistantName = "Luna",
  streaming = false,
  error = false,
  edited = false,
  onEdit,
  onRegenerate,
  onRetry,
  actionsDisabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [copyStatus, setCopyStatus] = useState("");

  async function copyMessage() {
    try {
      if (window.electronAPI?.copyText) await window.electronAPI.copyText(text);
      else await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
    setTimeout(() => setCopyStatus(""), 1800);
  }

  function submitEdit(event) {
    event.preventDefault();
    const nextText = draft.trim();
    if (!nextText || nextText === text) {
      setEditing(false);
      setDraft(text);
      return;
    }
    setEditing(false);
    onEdit?.(nextText);
  }

  return (

    <div
      className={`message-row ${
        sender === "user"
          ? "user"
          : "assistant"
      }`}
    >
      {sender !== "user" && (
        <div className="message-avatar" aria-hidden="true">
          {assistantName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="message-content">
        <span className="message-author">
          {sender === "user" ? "You" : assistantName}
          {edited && <em>Edited</em>}
        </span>
        {editing ? (
          <form className="message-edit-form" onSubmit={submitEdit}>
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setEditing(false);
                  setDraft(text);
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              aria-label="Edit message"
            />
            <div>
              <button type="button" onClick={() => { setEditing(false); setDraft(text); }}>Cancel</button>
              <button type="submit">Save and resend</button>
            </div>
          </form>
        ) : (
        <div className={`chat-bubble${streaming ? " streaming" : ""}${error ? " error" : ""}`}>
          {sender === "assistant" && streaming ? (
            <p className="streaming-plain-text">{text}</p>
          ) : sender === "assistant" ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: CopyableCodeBlock,
                a: ({ href, children }) => (
                  <span className="markdown-link" title={href}>{children}</span>
                ),
                img: ({ alt }) => (
                  <span className="markdown-image-placeholder">[Image: {alt || "external image"}]</span>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          ) : (
            <p>{text}</p>
          )}
        </div>
        )}
        {!streaming && !editing && (
          <div className="message-actions" aria-label="Message actions">
            <button type="button" onClick={copyMessage}>{copyStatus || "Copy"}</button>
            {onEdit && (
              <button type="button" disabled={actionsDisabled} onClick={() => { setDraft(text); setEditing(true); }}>Edit</button>
            )}
            {onRegenerate && !error && (
              <button type="button" disabled={actionsDisabled} onClick={onRegenerate}>Regenerate</button>
            )}
            {onRetry && error && (
              <button type="button" disabled={actionsDisabled} onClick={onRetry}>Retry</button>
            )}
          </div>
        )}
      </div>
    </div>

  );

}

function chatBubblePropsEqual(previous, next) {
  return previous.sender === next.sender &&
    previous.text === next.text &&
    previous.assistantName === next.assistantName &&
    previous.streaming === next.streaming &&
    previous.error === next.error &&
    previous.edited === next.edited &&
    previous.actionsDisabled === next.actionsDisabled &&
    Boolean(previous.onEdit) === Boolean(next.onEdit) &&
    Boolean(previous.onRegenerate) === Boolean(next.onRegenerate) &&
    Boolean(previous.onRetry) === Boolean(next.onRetry);
}

export default memo(ChatBubble, chatBubblePropsEqual);
