/** Deterministic synthetic geometry. These are visual studies, not customer data. */
export type SceneMode = "field" | "lidar" | "network";
export function particleField(mode: SceneMode, count: number): Float32Array {
  const result = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    let x = 0,
      y = 0,
      z = 0;
    const u = (i % side) / (side - 1),
      v = Math.floor(i / side) / (side - 1);
    if (mode === "field") {
      x = (u - 0.5) * 13;
      z = (v - 0.5) * 11;
      const r = Math.hypot(x, z);
      y =
        2.5 * Math.sin(r * 1.05 - 0.8) * Math.exp(-r * 0.15) +
        0.45 * Math.cos(x * 0.7 + z * 0.55);
    } else if (mode === "lidar") {
      const ring = i % 40,
        angle = (Math.floor(i / 40) / Math.ceil(count / 40)) * Math.PI * 2;
      const radius = 1.1 + ring * 0.15;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = -1.3 + Math.max(0, Math.sin(angle * 5 + 0.4) - 0.65) * ring * 0.22;
    } else {
      const band = i % 7,
        t = (Math.floor(i / 7) / (count / 7)) * Math.PI * 2;
      const r = 2.4 + band * 0.42;
      const tilt = (band * Math.PI) / 7;
      x = Math.cos(t) * r;
      y = Math.sin(t) * r * Math.cos(tilt);
      z = Math.sin(t) * r * Math.sin(tilt);
      const jitter = Math.sin(i * 17.13) * 0.07;
      x += jitter;
      y += jitter;
      z -= jitter;
    }
    result.set([x, y, z], i * 3);
  }
  return result;
}
