import type { SceneDef } from "./types";
import { driving } from "./domains/driving";
import { annotation } from "./domains/annotation";

export const scenes: SceneDef[] = [...driving, ...annotation];

export const sceneOf = (id: string) => scenes.find((s) => s.id === id);
export const scenesIn = (domain: string) => scenes.filter((s) => s.domain === domain);

const featuredKeys: [string, string][] = [["perception", "lidar"], ["log-replay", "mcap"], ["planning", "prediction"], ["calibration", "residual"]];
export const featured = featuredKeys.map(([s, d]) => { const scene = sceneOf(s)!; return { scene, demo: scene.demos.find((x) => x.id === d)! }; }).filter((f) => f.scene && f.demo);

export const libCount = new Set(scenes.flatMap((s) => s.demos.flatMap((d) => d.libs.map((l) => l.name)))).size;
