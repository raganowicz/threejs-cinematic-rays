"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import Stats from "stats.js";
import { Vector2, Vector3 } from "three";
import {
  createDefaultGodraysOptions,
  DEFAULT_GODRAYS_OPTIONS,
  ThreeBackgroundGodraysDemo,
  type GodraysSceneOptions,
} from "@/lib/godrays";

const vectorToHex = (vector: Vector3): string =>
  `#${[vector.x, vector.y, vector.z]
    .map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;

const hexToVector3 = (hex: string): Vector3 => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const parsed = Number.parseInt(value, 16);
  const r = ((parsed >> 16) & 255) / 255;
  const g = ((parsed >> 8) & 255) / 255;
  const b = (parsed & 255) / 255;

  return new Vector3(r, g, b);
};

export function GodraysCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = containerRef.current;

    if (!mount) {
      return;
    }

    const options: GodraysSceneOptions = createDefaultGodraysOptions();
    const godrays = new ThreeBackgroundGodraysDemo({ mount, options });
    const debugMode = window.location.hash.includes("debug");

    let stats: Stats | null = null;
    let gui: GUI | null = null;
    let rafId = 0;

    const handleResize = () => {
      godrays.setSize(mount.clientWidth, mount.clientHeight);
    };

    if (debugMode) {
      stats = new Stats();
      stats.showPanel(0);
      stats.dom.style.position = "fixed";
      stats.dom.style.top = "0";
      stats.dom.style.left = "0";
      stats.dom.style.zIndex = "20";
      document.body.appendChild(stats.dom);

      gui = new GUI({ title: "Three.js Background Godrays" });

      const backgroundFolder = gui.addFolder("Background");
      backgroundFolder
        .add(options.background, "transparent")
        .name("transparent")
        .onChange((value: boolean) => {
          godrays.updateOptions({
            background: {
              transparent: value,
            },
          });
        });

      backgroundFolder
        .addColor(options.background, "color")
        .name("color")
        .onChange((value: string) => {
          godrays.updateOptions({
            background: {
              color: value,
            },
          });
        });

      const modelState = options.model ?? { visible: true };
      options.model = modelState;
      const modelFolder = gui.addFolder("Model");
      modelFolder.add(modelState, "visible").name("visible").onChange((value: boolean) => {
        godrays.updateOptions({
          model: {
            visible: value,
          },
        });
      });

      const updateLayerOption = (
        layerKey: "backgroundLayer" | "foregroundLayer",
        patch: Partial<NonNullable<GodraysSceneOptions["backgroundLayer"]>>,
      ) => {
        if (layerKey === "backgroundLayer") {
          godrays.updateOptions({ backgroundLayer: patch });
          return;
        }

        godrays.updateOptions({ foregroundLayer: patch });
      };

      const bindLayerControls = (
        folderName: string,
        layerKey: "backgroundLayer" | "foregroundLayer",
      ) => {
        const folder = gui!.addFolder(folderName);
        const layer = options[layerKey];
        const uiState = {
          color: vectorToHex(layer.color ?? new Vector3(0.612, 0.639, 0.651)),
          originX: layer.origin?.x ?? 1.48,
          originY: layer.origin?.y ?? 1.86,
        };

        if (typeof layer.visible !== "boolean") {
          layer.visible = true;
        }
        if (typeof layer.intensity !== "number") {
          layer.intensity = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.intensity ?? 0.2;
        }
        if (typeof layer.opacity !== "number") {
          layer.opacity = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.opacity ?? 1;
        }
        if (typeof layer.angle !== "number") {
          layer.angle = -2.3;
        }
        if (typeof layer.raySpeed !== "number") {
          layer.raySpeed = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.raySpeed ?? 1.0;
        }
        if (typeof layer.rayDirection !== "number") {
          layer.rayDirection = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayDirection ?? -1;
        }
        if (typeof layer.rayMotion !== "number") {
          layer.rayMotion = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayMotion ?? 2;
        }
        if (typeof layer.rayDepthMode !== "number") {
          layer.rayDepthMode = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayDepthMode ?? 2;
        }
        if (typeof layer.beamFocus !== "number") {
          layer.beamFocus = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.beamFocus ?? 1.0;
        }
        if (typeof layer.raySpread !== "number") {
          layer.raySpread = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.raySpread ?? 1.0;
        }
        if (typeof layer.rayThickness !== "number") {
          layer.rayThickness = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayThickness ?? 1.0;
        }
        if (typeof layer.rayCount !== "number") {
          layer.rayCount = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayCount ?? 8;
        }

        folder.add(layer, "visible").onChange((value: boolean) => {
          updateLayerOption(layerKey, { visible: value });
        });
        folder.addColor(uiState, "color").onChange((value: string) => {
          updateLayerOption(layerKey, { color: hexToVector3(value) });
        });
        folder.add(layer, "opacity", 0, 1, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { opacity: value });
        });
        folder.add(layer, "intensity", 0, 3, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { intensity: value });
        });
        folder.add(layer, "angle", -3.2, 0.8, 0.001).onChange((value: number) => {
          updateLayerOption(layerKey, { angle: value });
        });
        folder.add(uiState, "originX", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { origin: new Vector2(value, uiState.originY) });
        });
        folder.add(uiState, "originY", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { origin: new Vector2(uiState.originX, value) });
        });
        folder.add(layer, "raySpeed", 0.1, 3, 0.01).name("ray speed").onChange((value: number) => {
          updateLayerOption(layerKey, { raySpeed: value });
        });
        folder
          .add(layer, "rayMotion", {
            "linear top to bottom": 0,
            "linear bottom to top": 1,
            "orbit clockwise": 2,
            "orbit counterclockwise": 3,
          })
          .name("ray motion")
          .onChange((value: number) => {
            updateLayerOption(layerKey, { rayMotion: Number(value) });
          });
        folder
          .add(layer, "rayDepthMode", {
            "behind model": 0,
            "in front of model": 1,
            "behind and in front": 2,
          })
          .name("ray depth")
          .onChange((value: number) => {
            updateLayerOption(layerKey, { rayDepthMode: Number(value) });
          });
        folder.add(layer, "beamFocus", 0.05, 16, 0.01).name("beam focus").onChange((value: number) => {
          updateLayerOption(layerKey, { beamFocus: value });
        });
        folder.add(layer, "raySpread", 0.2, 3, 0.01).name("ray spread").onChange((value: number) => {
          updateLayerOption(layerKey, { raySpread: value });
        });
        folder.add(layer, "rayThickness", 0.005, 4, 0.001).name("ray thickness").onChange((value: number) => {
          updateLayerOption(layerKey, { rayThickness: value });
        });
        folder.add(layer, "rayCount", 1, 32, 1).name("ray count").onChange((value: number) => {
          updateLayerOption(layerKey, { rayCount: value });
        });
      };

      bindLayerControls("Light Rays", "backgroundLayer");
    }

    const animate = () => {
      stats?.begin();
      godrays.render();
      stats?.end();
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      gui?.destroy();
      stats?.dom.remove();
      godrays.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 h-screen w-screen overflow-hidden" />;
}
