# Cinematic Rays

Copy this folder into your project. Install `three`.

## What you need

| File | Required? |
| --- | --- |
| `SpatialGodRays.ts` | **Yes** — drop into your Three.js scene |
| `types.ts` | **Yes** — options and defaults |
| `index.ts` | **Yes** — imports |
| `presets.ts` | No — starting values; delete blocks you do not use |
| `OverlayGodrays.ts` | No — only if you want a full-page canvas without your own scene |

## Usage

```ts
import { SpatialGodRays } from "./lib/godrays";

const rays = new SpatialGodRays({
  color: new Vector3(0.612, 0.639, 0.651),
  origin: new Vector2(1.48, 1.86),
  angle: -2.3,
  intensity: 0.75,
  opacity: 0.58,
});

for (const mesh of rays.meshes) scene.add(mesh);

// each frame
rays.update(delta);

// on resize
rays.resize(camera, width, height);
```

## Presets

Edit `presets.ts` for default values. Removing `foregroundLayer`, `model`, or `heroText` is safe.
