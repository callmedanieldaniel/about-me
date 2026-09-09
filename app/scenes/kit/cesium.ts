import { loadScript } from "../../lib/sdk";
// Cesium loader: the prebuilt UMD bundle is served from /vendor/cesium (copied by scripts/copy-assets.mjs) and loaded at runtime, bypassing the bundler.
type CesiumNS = typeof import("cesium");
export async function loadCesium(): Promise<CesiumNS> {
  const w = window as unknown as { CESIUM_BASE_URL: string; Cesium?: CesiumNS };
  w.CESIUM_BASE_URL = "/vendor/cesium";
  if (!document.querySelector("link[data-cesium]")) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/vendor/cesium/Widgets/widgets.css"; l.dataset.cesium = "1"; document.head.appendChild(l); }
  if (!w.Cesium) await loadScript("/vendor/cesium/Cesium.js");
  return w.Cesium!;
}
export function darkViewer(C: CesiumNS, el: HTMLElement) {
  const viewer = new C.Viewer(el, { baseLayer: C.ImageryLayer.fromProviderAsync(Promise.resolve(new C.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })), {}), baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false, infoBox: false, selectionIndicator: false, skyBox: false, skyAtmosphere: new C.SkyAtmosphere() });
  viewer.scene.backgroundColor = C.Color.fromCssColorString("#05080e");
  viewer.scene.globe.baseColor = C.Color.fromCssColorString("#0c1628");
  viewer.scene.globe.enableLighting = true;
  const layer = viewer.imageryLayers.get(0); if (layer) { layer.brightness = 0.35; layer.saturation = 0.3; layer.contrast = 1.3; }
  return viewer;
}
