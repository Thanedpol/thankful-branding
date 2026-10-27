/** Glowing stand-in shown while three.js loads, and if WebGL is unavailable.
 *  Kept in its own file so importing it never drags three.js into the page bundle. */
export default function EarthPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="aspect-square w-[46%] rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #2a6fd6 0%, #0b2a6b 55%, #040b22 100%)",
          boxShadow: "0 0 40px 10px rgba(80,160,255,0.45), 0 0 120px 40px rgba(40,110,255,0.25)",
        }}
      />
    </div>
  );
}
