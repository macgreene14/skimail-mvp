"use client";

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: 40, fontFamily: "monospace", color: "#fff", background: "#111" }}>
      <h2>⚠️ Skimail Error</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#f87171" }}>
        {error?.message}
      </pre>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#94a3b8", fontSize: 12 }}>
        {error?.stack}
      </pre>
      <button
        onClick={() => reset()}
        style={{ marginTop: 16, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
