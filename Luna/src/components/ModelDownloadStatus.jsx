import "../styles/ModelDownloadStatus.css";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex > 1 ? 1 : 0)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 60) return `${seconds}s remaining`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m remaining`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m remaining`;
}

function ModelDownloadStatus({ download, onCancel, onRetry }) {
  if (!download) return null;

  const activeStates = ["starting", "downloading", "retrying", "cancelling"];
  const isActive = activeStates.includes(download.state);
  const percent = Number.isFinite(download.percent) ? download.percent : 0;
  const speed = download.speedBps > 0 ? `${formatBytes(download.speedBps)}/s` : "";
  const eta = formatDuration(download.etaSeconds);
  const transferred = download.completed > 0 && download.total > 0
    ? `${formatBytes(download.completed)} of ${formatBytes(download.total)}`
    : "";

  return (
    <div className={`model-download-status state-${download.state}`} aria-live="polite">
      <div className="model-download-status-row">
        <p>{download.status}</p>
        {Number.isFinite(download.percent) && <strong>{download.percent}%</strong>}
      </div>

      {isActive && (
        <div
          className="model-download-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
          aria-label={`Downloading ${download.model}`}
        >
          <div style={{ width: `${percent}%` }} />
        </div>
      )}

      {(transferred || speed || eta) && (
        <div className="model-download-metrics">
          {transferred && <span>{transferred}</span>}
          {speed && <span>{speed}</span>}
          {eta && <span>{eta}</span>}
        </div>
      )}

      <div className="model-download-controls">
        {isActive && download.state !== "cancelling" && (
          <button type="button" className="model-cancel-btn" onClick={onCancel}>
            Cancel download
          </button>
        )}
        {download.state === "error" && download.retryable && (
          <button type="button" className="model-retry-btn" onClick={onRetry}>
            Retry download
          </button>
        )}
      </div>

      {download.state === "error" && download.detail && (
        <details className="model-download-details">
          <summary>Technical details</summary>
          <span>{download.detail}</span>
        </details>
      )}
    </div>
  );
}

export default ModelDownloadStatus;
