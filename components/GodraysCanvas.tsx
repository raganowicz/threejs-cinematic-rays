"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import Stats from "stats.js";
import { Vector2, Vector3 } from "three";
import {
  createDefaultGodraysOptions,
  DEFAULT_GODRAYS_OPTIONS,
  ThreeBackgroundGodrays,
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
    const godrays = new ThreeBackgroundGodrays({ mount, options });
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
      };

      bindLayerControls("Background Rays", "backgroundLayer");
      bindLayerControls("Foreground Rays", "foregroundLayer");
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

  return <div ref={containerRef} className="h-screen w-screen" />;
}
