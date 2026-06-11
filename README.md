# Three.js Cinematic Rays

Reusable **pure three.js** cinematic rays and stylized god rays for backgrounds, foreground overlays, reflective scenes, and lightweight spatial light sheets.

Three.js Cinematic Rays is built for art-directed landing pages, product scenes, atmospheric WebGL backgrounds, reflective chrome details, and dramatic light beams that are quick to tune and easy to drop into an existing Three.js scene. It is not limited to hero sections, but it works especially well anywhere you need cinematic Three.js god rays without a full postprocessing pipeline.

No `@react-three/fiber`, no `drei`.

---

## Installation

```bash
pnpm install
pnpm dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## Live Demo

Vercel demo: _add link here after deployment_

---

## Debug Mode (GUI + Performance)

Open app with:

```text
http://localhost:3000/#debug
```

This enables:

- `lil-gui` controls,
- `stats.js` performance panel.

---

## Project Structure

```text
lib/godrays/
  shaders.ts                # GLSL shaders
  GodraysLayer.ts           # Single full-screen godrays layer
  ThreeBackgroundGodrays.ts # Main reusable class (pure three.js)
  ThreeBackgroundGodraysDemo.ts # Spatial 3D rays + demo chrome model
  types.ts                  # Options and defaults
  index.ts                  # Public exports

components/
  GodraysCanvas.tsx         # Demo canvas + optional #debug controls
```

---

## Quick Use In Your Own Project

1. Copy `lib/godrays/*` into your project.
2. Install dependencies:

```bash
pnpm add three
pnpm add lil-gui stats.js
```

3. Use `SpatialGodRays` when you want light beams that exist in your Three.js scene, can sit behind or in front of meshes, and can be captured by reflective materials:

```ts
import { PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { SpatialGodRays } from "./lib/godrays";

const scene = new Scene();
const camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });

camera.position.z = 4.9;

const godrays = new SpatialGodRays({
  color: new Vector3(0.612, 0.639, 0.651),
  origin: new Vector2(1.48, 1.86),
  angle: -2.3,
  intensity: 0.75,
  opacity: 0.58,
  z: -1.8,
  frontZ: 0.45,
  raySpeed: 0.62,
  rayMotion: 2,
  rayDepthMode: 2,
  rayCount: 10,
  raySpread: 1.18,
  rayLength: 1.4,
  rayBrightness: 1,
  rayThickness: 0.32,
  raySoftness: 1,
});

for (const mesh of godrays.meshes) {
  scene.add(mesh);
}

let lastTime = performance.now();

function render(now: number) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  godrays.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  godrays.resize(camera, window.innerWidth, window.innerHeight);
});
```

Integration checklist:

- Add every mesh from `godrays.meshes` to your scene.
- Call `godrays.update(delta)` every frame before `renderer.render(...)`.
- Call `godrays.resize(camera, width, height)` after creating it and whenever the viewport changes.
- Use `z` for the back ray sheet and `frontZ` for the front ray sheet. Larger/deeper models may need a more negative `z` so the behind layer sits behind the model, text, or hero content.
- Use `rayDepthMode`: `0` only back layer, `1` only front layer, `2` both layers.
- For reflective objects, use your own cube camera or environment workflow and make sure the ray meshes are visible during the reflection capture.

Use `ThreeBackgroundGodrays` instead if you only need a full-screen background/foreground overlay and do not need spatial reflections.

The reusable 3D class is `SpatialGodRays`. It does not create a renderer or camera; it only owns the ray meshes and exposes `update(delta)`, `resize(camera, width, height)`, `applyOptions(options)`, and `dispose()`. All visual controls live in one options object.

The demo title is rendered inside Three.js as a canvas-textured plane behind the chrome model, not as a DOM overlay. It is excluded from the chrome reflection pass and defaults to `fontFamily: "Humane-Regular"`. The demo registers `Humane-Regular` from `public/webfonts`.

---

## Compared To `three-good-godrays`

Three.js Cinematic Rays is a lightweight, art-directed god rays layer. It is designed for backgrounds, foreground overlays, landing pages, reflective decorative rays, and quick reuse in an existing Three.js scene.

`three-good-godrays` is a heavier postprocessing effect. It raymarches through the scene and samples shadow maps, so it is better when you need volumetric light that reacts to real scene geometry, shadows, `PointLight`s, or `DirectionalLight`s.

Key differences:

- Three.js Cinematic Rays uses stylized shader planes / spatial light sheets; `three-good-godrays` uses a raymarched postprocessing pass.
- Three.js Cinematic Rays does not require shadow maps or real light sources; `three-good-godrays` does.
- Three.js Cinematic Rays has direct art controls like `rayCount`, `raySpread`, `rayLength`, `rayBrightness`, `rayThickness`, `rayMotion`, and `rayDepthMode`; `three-good-godrays` exposes physical/postprocess controls like density, attenuation, blur, and raymarch steps.
- Three.js Cinematic Rays is easier to copy into a small Three.js scene and tune visually; `three-good-godrays` is better for physically motivated volumetric lighting.
- Three.js Cinematic Rays can render rays behind, in front, or around a model and can be captured by reflective materials; `three-good-godrays` primarily affects the final postprocessed image.

Use this project for controllable visual mood and product/landing-page art direction. Use `three-good-godrays` for shadow-aware volumetric light in a full postprocessing pipeline.

---

## Parameters

| Option | Type | Default | Description |
| --- | --- | ---: | --- |
| `visible` | `boolean` | `true` | Enables/disables the ray meshes. |
| `color` | `Vector3` | `(0.612, 0.639, 0.651)` | Ray color in linear-ish RGB components. |
| `opacity` | `number` | `0.58` | Overall layer alpha. Lower this when the whole ray layer should blend more subtly. |
| `intensity` | `number` | `0.75` | Overall light contribution for wash, shafts, and bloom. |
| `angle` | `number` | `-2.3` | Main ray direction in radians. |
| `origin` | `Vector2` | `(1.48, 1.86)` | Source position in normalized screen-like coordinates. Values can be outside `0..1`. |
| `z` | `number` | `-1.8` | Back ray sheet depth. In the demo this sits behind both the model and hero text. |
| `frontZ` | `number` | `0.45` | Front ray sheet depth. Tune this when your model is larger/smaller or when foreground rays should sit closer/farther from the camera. |
| `raySpeed` | `number` | `0.62` | Animation speed. Safe to tweak live; it does not jump the phase. |
| `rayMotion` | `0 \| 1 \| 2 \| 3` | `2` | `0` linear top-to-bottom, `1` linear bottom-to-top, `2` orbit clockwise, `3` orbit counterclockwise. |
| `rayDepthMode` | `0 \| 1 \| 2` | `2` | `0` behind model/text, `1` in front of model, `2` both. |
| `rayCount` | `number` | `10` | Number of separate ray lanes. Range is clamped to `1..32`. |
| `raySpread` | `number` | `1.18` | Distance between ray lanes. Higher values place beams farther apart. |
| `rayLength` | `number` | `1.4` | Controls where each shaft fades out and how far the spatial ray sheets extend beyond the viewport. Higher values push the fade past the screen edge. Recommended range: `0.05..4` in `0.01` steps. |
| `rayBrightness` | `number` | `1.0` | Extra multiplier for the shaft/core light only. Higher values with lower `intensity` can create lightsaber-like bright cores with a softer glow. |
| `rayThickness` | `number` | `0.32` | Beam width. Very low values create focused, laser-like lines. |
| `raySoftness` | `number` | `1.0` | Edge softness of each beam. Lower values create sharper pillars; higher values create hazier, more diffused rays. |
| `raySeed` | `number` | random | Per-layer randomization seed. |

Hero text options:

| Option | Type | Default | Description |
| --- | --- | ---: | --- |
| `heroText.visible` | `boolean` | `true` | Shows/hides the Three.js text plane. |
| `heroText.text` | `string` | `"CINEMATIC RAYS"` | Text rendered into the canvas texture. |
| `heroText.color` | `string` | `"#EB6137"` | Text color. |
| `heroText.fontFamily` | `string` | `"Humane-Regular"` | CSS font-family used by the canvas texture. Not exposed in the demo GUI. |

Useful presets:

| Effect | Suggested changes |
| --- | --- |
| Soft window light | Higher `rayThickness`, medium/high `raySoftness`, low `rayCount`, medium `raySpread`. |
| Underwater shafts | Medium `rayThickness`, lower `raySpeed`, orbit motion, higher `raySpread`. |
| Disco lasers | Very low `rayThickness`, low `raySoftness`, higher `rayBrightness`, longer `rayLength`, linear motion. |

---

## Screenshots

> Add your screenshots below

- `![Default view](./public/screenshots/default.png)`
- `![Debug view](./public/screenshots/debug.png)`

---

## Dependencies

- `three`
- `lil-gui`
- `stats.js`

(This demo runs in Next.js, but the core godrays module is pure three.js and can be reused outside Next.js.)

---

## License

MIT License

Copyright (c) 2026 Piotr Raganowicz-Macina

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

**Attribution requirement:** When using this software in any project (including
commercial projects), please credit the original author (Piotr Raganowicz-Macina) in
your project documentation, README, or credits section.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
