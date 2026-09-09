import type { ComponentType } from "react";

export type Params = Record<string, number | boolean | string>;
export type Telemetry = Record<string, string | number>;

export type EngineProps = {
  params: Params;
  playing: boolean;
  resetKey: number;
  asset: ArrayBuffer | null;
  onTelemetry: (t: Telemetry) => void;
};

export type Control =
  | {
      key: string;
      label: string;
      type: "range";
      min: number;
      max: number;
      step: number;
      unit?: string;
      default: number;
    }
  | { key: string; label: string; type: "toggle"; default: boolean }
  | { key: string; label: string; type: "text"; default: string; hint?: string }
  | { key: string; label: string; type: "file"; accept: string; hint: string };

export type LabDef = {
  id: string;
  controls: Control[];
  legend: { color: string; label: string }[];
  assumptions: string;
  camera: string;
  load: () => Promise<{ default: ComponentType<EngineProps> }>;
};
