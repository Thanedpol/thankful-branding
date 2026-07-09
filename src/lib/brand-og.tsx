import { ImageResponse } from "next/og";

/** Shared 1200×630 branded social-share image (used for OG + Twitter cards). */
export const OG_SIZE = { width: 1200, height: 630 };

export function brandOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #070711 0%, #08060f 55%, #0b0716 100%)",
          color: "#F4F6FB",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            fontWeight: 600,
            color: "#00F5FF",
          }}
        >
          AI · BUSINESS · SCIENCE &amp; TECHNOLOGY
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: -2,
            marginTop: 20,
          }}
        >
          Thank Thanedpol
        </div>
        <div
          style={{
            display: "flex",
            width: 180,
            height: 6,
            borderRadius: 3,
            marginTop: 30,
            background: "linear-gradient(90deg, #00F5FF, #7B2FFF)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#8892A4",
            marginTop: 34,
          }}
        >
          Content Creator — AI &amp; Business news · Thailand &amp; worldwide
        </div>
      </div>
    ),
    OG_SIZE
  );
}
