# Fieldwork — an anonymous engineering portfolio

An interactive portfolio for spatial visualization, perception tooling, real-time systems, and cross-platform engineering. Built with the repository's existing Next.js, React, TypeScript, and Three.js stack.

## Run

```sh
npm ci
npm run dev
```

```sh
npm run build
npm start
```

The root page includes three deterministic 3D studies: a sampled spatial terrain, synthetic LiDAR rings with object bounds, and orbital system paths. Switch studies to morph between their geometries. Drag to orbit, pinch to zoom, or focus the canvas and use arrow keys and `+` / `-`. Pause stops automatic motion; Reset view restores the camera and scene orientation. Reduced-motion preferences disable autoplay and morph transitions. The renderer caps resolution and mobile particle count, suspends drawing offscreen and in background tabs, disposes GPU resources, and provides a retryable WebGL fallback.

Existing project URLs remain available. Without map configuration, project pages present a clearly labeled local synthetic 3D study. Existing third-party map demonstrations remain available when their corresponding browser keys are provided at build time:

```text
NEXT_PUBLIC_AMAP_KEY=
NEXT_PUBLIC_BAIDU_KEY=
```

These are public browser SDK keys, not server secrets. Configure provider restrictions for the deployment domain. No external map requests are made by the default local 3D studies. No remote fonts are required.

## Content and privacy

- `app/projects/data.ts`: anonymous project titles, technical categories, and library references.
- `app/projects/[slug]/page.tsx`: study descriptions and optional map demonstrations.
- `app/lib/particle-fields.ts`: deterministic synthetic geometry.
- `app/components/SceneCanvas.tsx`: renderer and accessible interaction.

The current source removes personal branding, email, personal profile links, employer attribution, employment dates, and embedded provider keys. No private resume files are included. Technical references to public SDKs are retained and do not claim employment, ownership, or sole authorship. Public repository ownership, previous Git history, and existing deployment caches are outside page-level anonymization; this change does not rewrite Git history or change repository settings. Previously committed provider keys should be rotated separately.

The displayed geometry is illustrative, not a real sensor recording, geographic dataset, system topology, or performance benchmark. No unsupported performance metrics are presented as career achievements.

## Verification

```sh
node scripts/verify.mjs
npm run build
```

The verification script checks deterministic finite geometry, preserved project routes, and personal identifiers / embedded credentials in current source. The production build checks TypeScript and prerenders all project pages. Browser/device visual testing is a separate manual check.
