import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          minHeight: "240px",
          padding: "32px",
          color: "var(--text, #f5f5f8)",
          background: "var(--background, #090b11)",
          textAlign: "center",
          boxSizing: "border-box",
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            padding: "28px",
            borderRadius: "16px",
            background: "var(--card, #151821)",
            border: "1px solid var(--border, #252936)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
              Something went wrong in this view
            </h2>
            <p style={{ fontSize: "13px", color: "var(--secondary-text, #989cac)", marginBottom: "20px", lineHeight: "1.5" }}>
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: "var(--primary, #8b7cff)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reload View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
