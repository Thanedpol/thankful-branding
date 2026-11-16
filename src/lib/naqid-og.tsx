import { ImageResponse } from "next/og";

export const NAQID_OG_SIZE = { width: 1200, height: 630 };
export const NAQID_OG_ALT = "NAQID Group — We build technology worth thanking for.";

// Latin-only text: the OG renderer has no Thai font loaded.
export function naqidOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px",
          background: "#F5F2EA",
          color: "#070B18",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: "#0A6B5B" }}>DEEP TECH · THAILAND</div>
          <div style={{ display: "flex", fontSize: 120, fontWeight: 300, letterSpacing: 24, marginTop: 18 }}>NAQID</div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 10, color: "#3F4B66", marginTop: 4 }}>GROUP</div>
          <div style={{ display: "flex", fontSize: 34, color: "#3F4B66", marginTop: 44 }}>
            We build technology worth thanking for.
          </div>
        </div>
        <svg width="300" height="300" viewBox="0 0 40 40" fill="none">
          <path d="M6 32 L20 8 L34 32" stroke="#3F4B66" stroke-width="0.8" opacity="0.45" />
          <path d="M1 20 L20 20" stroke="#070B18" stroke-width="1" />
          <path d="M20 20 L39 11" stroke="#00E0B8" stroke-width="1.2" />
          <path d="M20 20 L39 20" stroke="#A78BFA" stroke-width="1.2" />
          <path d="M20 20 L39 29" stroke="#FFB020" stroke-width="1.2" />
        </svg>
      </div>
    ),
    NAQID_OG_SIZE
  );
}
