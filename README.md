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
- each layer also has: `color (Vector3)`, `opacity`, `intensity`, `angle`, `origin (Vector2)`, `z`

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
