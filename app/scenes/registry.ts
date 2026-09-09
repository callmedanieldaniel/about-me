import type { SceneDef } from "./types";
import { driving } from "./domains/driving";
import { annotation } from "./domains/annotation";
import { triage } from "./domains/triage";
import { embodied } from "./domains/embodied";
import { geo } from "./domains/geo";
import { simulation } from "./domains/simulation";
import { dataloop, spatial, ai, markets, science, industry } from "./domains/others";

export const scenes: SceneDef[] = [...driving, ...triage, ...geo, ...embodied, ...simulation, ...annotation, ...dataloop, ...spatial, ...ai, ...markets, ...science, ...industry];

export const sceneOf = (id: string) => scenes.find((s) => s.id === id);
export const scenesIn = (domain: string) => scenes.filter((s) => s.domain === domain);

const featuredKeys: [string, string][] = [["perception", "lidar"], ["log-replay", "mcap"], ["mujoco", "humanoid"], ["deckgl", "layers"], ["lidar-cuboid", "cuboid"], ["log-sim", "counterfactual"], ["cesium", "orbits"], ["viewer", "splats"]];
export const featured = featuredKeys.map(([s, d]) => { const scene = sceneOf(s)!; return { scene, demo: scene.demos.find((x) => x.id === d)! }; }).filter((f) => f.scene && f.demo);

export const libCount = new Set(scenes.flatMap((s) => s.demos.flatMap((d) => d.libs.map((l) => l.name)))).size;
