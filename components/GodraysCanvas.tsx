"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import Stats from "stats.js";
import { Vector2, Vector3 } from "three";
import {
  createDefaultGodraysOptions,
  DEFAULT_GODRAYS_OPTIONS,
  serializeGodraysPreset,
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

const makeGuiDraggable = (gui: GUI) => {
  const root = gui.domElement;
  const titleBar = gui.$title;
  let dragPointerId: number | null = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let didDrag = false;

  const onPointerMove = (event: PointerEvent) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    if (!didDrag) {
      didDrag = Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 3;
    }

    root.style.right = "auto";
    root.style.left = `${event.clientX - dragOffsetX}px`;
    root.style.top = `${event.clientY - dragOffsetY}px`;
  };

  const endDrag = (event: PointerEvent) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    dragPointerId = null;
    root.classList.remove("lil-gui--dragging");
    titleBar.releasePointerCapture(event.pointerId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };

  titleBar.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    didDrag = false;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    const rect = root.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    root.classList.add("lil-gui--dragging");
    titleBar.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  });

  titleBar.addEventListener("click", (event) => {
    if (didDrag) {
      event.preventDefault();
      event.stopImmediatePropagation();
      didDrag = false;
    }
  }, true);
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

      gui = new GUI({ title: "Three.js Cinematic Rays" });

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
        if (typeof layer.z !== "number") {
          layer.z = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.z ?? -1.8;
        }
        if (typeof layer.frontZ !== "number") {
          layer.frontZ = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.frontZ ?? 0.45;
        }
        if (typeof layer.raySpeed !== "number") {
          layer.raySpeed = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.raySpeed ?? 1.0;
        }
        if (typeof layer.rayDirection !== "number") {
          layer.rayDirection = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayDirection ?? -1;
        }
        if (typeof layer.rayMotion !== "number") {
          layer.rayMotion = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayMotion ?? 0;
        }
        if (typeof layer.rayDepthMode !== "number") {
          layer.rayDepthMode = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayDepthMode ?? 2;
        }
        if (typeof layer.raySpread !== "number") {
          layer.raySpread = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.raySpread ?? 1.0;
        }
        if (typeof layer.rayLength !== "number") {
          layer.rayLength = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayLength ?? 1.4;
        }
        if (typeof layer.rayBrightness !== "number") {
          layer.rayBrightness = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayBrightness ?? 1.0;
        }
        if (typeof layer.rayThickness !== "number") {
          layer.rayThickness = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.rayThickness ?? 1.0;
        }
        if (typeof layer.raySoftness !== "number") {
          layer.raySoftness = DEFAULT_GODRAYS_OPTIONS.backgroundLayer.raySoftness ?? 1.0;
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
        folder.add(layer, "rayBrightness", 0, 8, 0.01).name("brightness").onChange((value: number) => {
          updateLayerOption(layerKey, { rayBrightness: value });
        });
        folder.add(layer, "angle", -3.2, 0.8, 0.001).onChange((value: number) => {
          updateLayerOption(layerKey, { angle: value });
        });
        folder.add(layer, "z", -6, 2, 0.01).name("back z").onChange((value: number) => {
          updateLayerOption(layerKey, { z: value });
        });
        folder.add(layer, "frontZ", -2, 4, 0.01).name("front z").onChange((value: number) => {
          updateLayerOption(layerKey, { frontZ: value });
        });
        folder.add(uiState, "originX", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { origin: new Vector2(value, uiState.originY) });
        });
        folder.add(uiState, "originY", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption(layerKey, { origin: new Vector2(uiState.originX, value) });
        });
        folder.add(layer, "raySpeed", 0.1, 3, 0.01).name("speed").onChange((value: number) => {
          updateLayerOption(layerKey, { raySpeed: value });
        });
        folder
          .add(layer, "rayMotion", {
            "linear top to bottom": 0,
            "linear bottom to top": 1,
            "orbit clockwise": 2,
            "orbit counterclockwise": 3,
          })
          .name("motion")
          .onChange((value: number) => {
            updateLayerOption(layerKey, { rayMotion: Number(value) });
          });
        folder
          .add(layer, "rayDepthMode", {
            "behind model": 0,
            "in front of model": 1,
            "behind and in front": 2,
          })
          .name("depth")
          .onChange((value: number) => {
            updateLayerOption(layerKey, { rayDepthMode: Number(value) });
          });
        folder.add(layer, "raySpread", 0.2, 3, 0.01).name("spread").onChange((value: number) => {
          updateLayerOption(layerKey, { raySpread: value });
        });
        folder.add(layer, "rayLength", 0.05, 4, 0.01).name("length").onChange((value: number) => {
          updateLayerOption(layerKey, { rayLength: value });
        });
        folder.add(layer, "rayThickness", 0.005, 4, 0.001).name("thickness").onChange((value: number) => {
          updateLayerOption(layerKey, { rayThickness: value });
        });
        folder.add(layer, "raySoftness", 0.25, 3, 0.01).name("softness").onChange((value: number) => {
          updateLayerOption(layerKey, { raySoftness: value });
        });
        folder.add(layer, "rayCount", 1, 32, 1).name("count").onChange((value: number) => {
          updateLayerOption(layerKey, { rayCount: value });
        });
      };

      bindLayerControls("Light Rays", "backgroundLayer");

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
      backgroundFolder.close();

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
      modelFolder.close();

      const textState = options.heroText ?? {
        color: "#EB6137",
        fontFamily: "Humane-Regular",
        text: "CINEMATIC RAYS",
        visible: true,
      };
      options.heroText = textState;
      const textFolder = gui.addFolder("Text");
      textFolder.add(textState, "visible").name("visible").onChange((value: boolean) => {
        godrays.updateOptions({ heroText: { visible: value } });
      });
      textFolder.addColor(textState, "color").name("color").onChange((value: string) => {
        godrays.updateOptions({ heroText: { color: value } });
      });
      textFolder.close();

      const copyActions = {
        copyPreset: () => {
          const preset = serializeGodraysPreset(options);
          void navigator.clipboard.writeText(preset).then(() => {
            copyController.name("Copied!");
            window.setTimeout(() => {
              copyController.name("Copy preset");
            }, 1500);
          });
        },
      };
      const copyController = gui.add(copyActions, "copyPreset").name("Copy preset");

      makeGuiDraggable(gui);
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
