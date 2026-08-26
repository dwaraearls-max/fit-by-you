"use client";

import * as React from "react";

/**
 * The last line of defence: this replaces the root layout, so it cannot rely on
 * the app's fonts, providers or design tokens. Kept deliberately plain.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#faf8f5",
          color: "#141414",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8a8578",
            }}
          >
            Fit By You
          </p>
          <h1
            style={{
              margin: "1rem 0 0",
              fontSize: "1.5rem",
              lineHeight: 1.25,
              fontWeight: 600,
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#57534a",
            }}
          >
            Nothing was lost. Your customers, measurements and orders are all
            still saved. Try again, and if it keeps happening, sign out and back
            in.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#141414",
              color: "#faf8f5",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
