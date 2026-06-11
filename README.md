# Three.js Background Godrays

Reusable, modular **pure three.js** godrays snippet for:

- animated rays in the **background**,
- animated rays in the **foreground**,
- independent on/off for each layer,
- transparent or solid-color background.

No `@react-three/fiber`, no `drei`.

Shader and blend behavior are ported from the Olympic implementation.

---

## Installation

```bash
pnpm install
pnpm dev
```

Open: [http://localhost:3000](http://localhost:3000)

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

3. Create instance and render in your own animation loop:

```ts
import {
  DEFAULT_GODRAYS_OPTIONS,
  ThreeBackgroundGodrays,
} from "./lib/godrays";

const mount = document.getElementById("canvas-root")!;

const godrays = new ThreeBackgroundGodrays({
  mount,
  options: {
    ...DEFAULT_GODRAYS_OPTIONS,
    background: {
      transparent: false,
      color: "#020712",
    },
  },
});

function tick(t: number) {
  godrays.render(t * 0.001);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
window.addEventListener("resize", () => {
  godrays.setSize(mount.clientWidth, mount.clientHeight);
});
```

---

## Main Options

- `background.transparent` - `true`/`false`
- `background.color` - clear color when not transparent
- `backgroundLayer.visible` - show/hide background rays
- `foregroundLayer.visible` - show/hide foreground rays
- each layer also has:
  - `color` (Vector3) - ray color
  - `opacity` - layer opacity (0-1)
  - `intensity` - light intensity
  - `angle` - ray direction angle
  - `origin` (Vector2) - light source position
  - `z` - layer depth
  - `raySpeed` - animation speed multiplier (default: 1.0)
  - `beamFocus` - beam sharpness, higher = more laser-like (default: 1.0)
  - `raySpread` - how spread out rays are (default: 1.0)
  - `rayCount` - number of ray beams, 1-32 (default: 8)

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

Copyright (c) 2024 Rafał Raganowicz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

**Attribution requirement:** When using this software in any project (including
commercial projects), please credit the original author (Rafał Raganowicz) in
your project documentation, README, or credits section.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
