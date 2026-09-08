export type BrakeConfig = {
  speed: number;
  distance: number;
  delay: number;
  friction: number;
};
export type BrakeFrame = {
  position: number;
  velocity: number;
  stopped: boolean;
  collision: boolean;
};
export function stoppingDistance(c: BrakeConfig) {
  const v = c.speed / 3.6;
  return v * c.delay + (v * v) / (2 * c.friction * 9.81);
}
export function brakeFrame(c: BrakeConfig, time: number): BrakeFrame {
  const v = c.speed / 3.6,
    a = c.friction * 9.81;
  const t = Math.max(0, time),
    braking = Math.min(Math.max(0, t - c.delay), v / a);
  const position =
    v * Math.min(t, c.delay) + v * braking - 0.5 * a * braking * braking;
  return {
    position: Math.min(position, c.distance),
    velocity: position >= c.distance ? 0 : Math.max(0, v - a * braking),
    stopped: braking >= v / a,
    collision: position >= c.distance,
  };
}
export function collisionSpeed(c: BrakeConfig) {
  const v = c.speed / 3.6,
    remaining = c.distance - v * c.delay;
  return remaining <= 0
    ? v * 3.6
    : Math.sqrt(Math.max(0, v * v - 2 * c.friction * 9.81 * remaining)) * 3.6;
}
export const LINK_LENGTHS = [2.4, 1.8] as const;
export function forwardKinematics(shoulder: number, elbow: number) {
  const a = (shoulder * Math.PI) / 180,
    b = (elbow * Math.PI) / 180;
  const joint = {
    x: LINK_LENGTHS[0] * Math.cos(a),
    y: LINK_LENGTHS[0] * Math.sin(a),
  };
  return {
    joint,
    tip: {
      x: joint.x + LINK_LENGTHS[1] * Math.cos(a + b),
      y: joint.y + LINK_LENGTHS[1] * Math.sin(a + b),
    },
  };
}
export function inverseKinematics(x: number, y: number) {
  const [l1, l2] = LINK_LENGTHS;
  const cosine = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (cosine < -1 - 1e-10 || cosine > 1 + 1e-10) return null;
  const elbow = Math.acos(Math.max(-1, Math.min(1, cosine)));
  const shoulder =
    Math.atan2(y, x) -
    Math.atan2(l2 * Math.sin(elbow), l1 + l2 * Math.cos(elbow));
  return {
    shoulder: (((shoulder * 180) / Math.PI + 540) % 360) - 180,
    elbow: (elbow * 180) / Math.PI,
  };
}
export function isSupportedGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < 20) return false;
  const view = new DataView(buffer);
  return (
    view.getUint32(0, true) === 0x46546c67 &&
    view.getUint32(4, true) === 2 &&
    view.getUint32(8, true) === buffer.byteLength
  );
}
