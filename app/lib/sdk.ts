// Browser-side script loaders for external map SDKs.
// Optional public browser keys are supplied by the deployment environment.

export const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || "";
export const BAIDU_KEY = process.env.NEXT_PUBLIC_BAIDU_KEY || "";

const scriptCache: Record<string, Promise<void>> = {};

export function loadScript(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const cached = scriptCache[src];
  if (cached) return cached;

  scriptCache[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("load fail")),
        );
      }
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`load failed: ${src}`));
    document.head.appendChild(s);
  });
  return scriptCache[src];
}

/* ---------------- AMap ---------------- */

let amapPromise: Promise<unknown> | null = null;

export async function loadAMap(plugins: string[] = []): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("SSR");
  if (!AMAP_KEY) throw new Error("Map provider is not configured");
  if (amapPromise) return amapPromise;

  // AMap v2 advises a security config global; harmless if unused.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._AMapSecurityConfig = (window as any)._AMapSecurityConfig || {
    serviceHost: "",
  };

  amapPromise = loadScript("https://webapi.amap.com/loader.js").then(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loader = (window as any).AMapLoader;
    return loader.load({
      key: AMAP_KEY,
      version: "2.0",
      plugins,
    });
  });
  return amapPromise;
}

// Loca must load AFTER AMap. We do it via a tagged script.
let locaPromise: Promise<unknown> | null = null;

export async function loadLoca(): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("SSR");
  if (locaPromise) return locaPromise;
  await loadAMap([]);
  locaPromise = loadScript(
    `https://webapi.amap.com/loca?v=2.0.0&key=${AMAP_KEY}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).then(() => (window as any).Loca);
  return locaPromise;
}

/* ---------------- Baidu BMapGL ---------------- */

let bmapPromise: Promise<unknown> | null = null;

export async function loadBMap(): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("SSR");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!BAIDU_KEY) throw new Error("Map provider is not configured");
  if (w.BMapGL) return w.BMapGL;
  if (bmapPromise) return bmapPromise;

  bmapPromise = new Promise((resolve, reject) => {
    w.__bmapInit__ = () => resolve(w.BMapGL);
    const src = `https://api.map.baidu.com/api?v=3.0&type=webgl&ak=${BAIDU_KEY}&callback=__bmapInit__`;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onerror = () => reject(new Error("BMapGL load failed"));
    document.head.appendChild(s);
  });
  return bmapPromise;
}

/* ---------------- Mapv ---------------- */

export async function loadMapv(): Promise<unknown> {
  if (typeof window === "undefined") throw new Error("SSR");
  await loadScript("https://unpkg.com/mapv@2.0.62/build/mapv.min.js");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).mapv;
}
