import { ImageResponse } from "next/og";

export const alt = "FIT BY YOU — Your Fashion Business Has a Memory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080A",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Champagne wash */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(212,183,106,0.28) 0%, rgba(8,8,10,0) 68%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: "#D4B76A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#08080A",
            }}
          >
            F
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: "#FAF8F4",
              fontWeight: 600,
            }}
          >
            FIT BY YOU
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              color: "#FAF8F4",
              letterSpacing: -2,
            }}
          >
            Your Fashion Business
          </div>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              color: "#D4B76A",
              letterSpacing: -2,
            }}
          >
            Has a Memory.
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 27,
              lineHeight: 1.45,
              color: "rgba(250,248,244,0.58)",
              maxWidth: 840,
            }}
          >
            Customer measurements, styles, orders, photos and payment records in
            one beautifully simple workspace.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 36,
            fontSize: 19,
            color: "rgba(250,248,244,0.38)",
          }}
        >
          <span>Tailors</span>
          <span>·</span>
          <span>Seamstresses</span>
          <span>·</span>
          <span>Fashion Designers</span>
          <span>·</span>
          <span>Fashion Houses</span>
        </div>
      </div>
    ),
    size,
  );
}
