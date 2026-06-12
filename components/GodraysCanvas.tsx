"use client";

import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import Stats from "stats.js";
import { Vector2, Vector3 } from "three";
import {
  createDefaultGodraysOptions,
  FALLBACK_RAY_OPTIONS,
  type GodraysSceneOptions,
} from "@/lib/godrays";
import { DemoScene, serializeGodraysPreset } from "@/lib/demo";

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
    console.log(
      "%cThree.js Cinematic Rays\n%cBY PIOTR RAGANOWICZ-MACINA © 2026",
      "font-size:14px;font-weight:700",
      "font-size:11px;letter-spacing:0.12em",
    );

    const mount = containerRef.current;

    if (!mount) {
      return;
    }

    const options: GodraysSceneOptions = createDefaultGodraysOptions();
    const godrays = new DemoScene({ mount, options });
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

      const bindLayerControls = (folderName: string) => {
        const folder = gui!.addFolder(folderName);
        const layer = options.backgroundLayer;
        const uiState = {
          color: vectorToHex(layer.color ?? new Vector3(0.612, 0.639, 0.651)),
          originX: layer.origin?.x ?? 1.48,
          originY: layer.origin?.y ?? 1.86,
        };

        if (typeof layer.visible !== "boolean") {
          layer.visible = true;
        }
        if (typeof layer.intensity !== "number") {
          layer.intensity = FALLBACK_RAY_OPTIONS.intensity ?? 0.2;
        }
        if (typeof layer.opacity !== "number") {
          layer.opacity = FALLBACK_RAY_OPTIONS.opacity ?? 1;
        }
        if (typeof layer.angle !== "number") {
          layer.angle = -2.3;
        }
        if (typeof layer.z !== "number") {
          layer.z = FALLBACK_RAY_OPTIONS.z ?? -1.8;
        }
        if (typeof layer.frontZ !== "number") {
          layer.frontZ = FALLBACK_RAY_OPTIONS.frontZ ?? 0.45;
        }
        if (typeof layer.raySpeed !== "number") {
          layer.raySpeed = FALLBACK_RAY_OPTIONS.raySpeed ?? 1.0;
        }
        if (typeof layer.rayDirection !== "number") {
          layer.rayDirection = FALLBACK_RAY_OPTIONS.rayDirection ?? -1;
        }
        if (typeof layer.rayMotion !== "number") {
          layer.rayMotion = FALLBACK_RAY_OPTIONS.rayMotion ?? 0;
        }
        if (typeof layer.rayDepthMode !== "number") {
          layer.rayDepthMode = FALLBACK_RAY_OPTIONS.rayDepthMode ?? 2;
        }
        if (typeof layer.raySpread !== "number") {
          layer.raySpread = FALLBACK_RAY_OPTIONS.raySpread ?? 1.0;
        }
        if (typeof layer.rayLength !== "number") {
          layer.rayLength = FALLBACK_RAY_OPTIONS.rayLength ?? 1.4;
        }
        if (typeof layer.rayBrightness !== "number") {
          layer.rayBrightness = FALLBACK_RAY_OPTIONS.rayBrightness ?? 1.0;
        }
        if (typeof layer.rayThickness !== "number") {
          layer.rayThickness = FALLBACK_RAY_OPTIONS.rayThickness ?? 1.0;
        }
        if (typeof layer.raySoftness !== "number") {
          layer.raySoftness = FALLBACK_RAY_OPTIONS.raySoftness ?? 1.0;
        }
        if (typeof layer.rayCount !== "number") {
          layer.rayCount = FALLBACK_RAY_OPTIONS.rayCount ?? 8;
        }
        if (typeof layer.rayPulse !== "boolean") {
          layer.rayPulse = false;
        }
        if (typeof layer.rayPulseSpeed !== "number") {
          layer.rayPulseSpeed = 0.35;
        }
        if (typeof layer.rayPulseAmount !== "number") {
          layer.rayPulseAmount = 1;
        }
        if (typeof layer.rayPulseStagger !== "number") {
          layer.rayPulseStagger = 0.45;
        }

        folder.add(layer, "visible").onChange((value: boolean) => {
          updateLayerOption("backgroundLayer", { visible: value });
        });
        folder.addColor(uiState, "color").onChange((value: string) => {
          updateLayerOption("backgroundLayer", { color: hexToVector3(value) });
        });
        folder.add(layer, "opacity", 0, 1, 0.01).onChange((value: number) => {
          updateLayerOption("backgroundLayer", { opacity: value });
        });
        folder.add(layer, "intensity", 0, 3, 0.01).onChange((value: number) => {
          updateLayerOption("backgroundLayer", { intensity: value });
        });
        folder.add(layer, "rayBrightness", 0, 8, 0.01).name("brightness").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayBrightness: value });
        });
        folder.add(layer, "angle", -3.2, 0.8, 0.001).onChange((value: number) => {
          updateLayerOption("backgroundLayer", { angle: value });
        });
        folder.add(layer, "z", -6, 2, 0.01).name("back z").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { z: value });
        });
        folder.add(layer, "frontZ", -2, 4, 0.01).name("front z").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { frontZ: value });
        });
        folder.add(uiState, "originX", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption("backgroundLayer", { origin: new Vector2(value, uiState.originY) });
        });
        folder.add(uiState, "originY", -2, 3, 0.01).onChange((value: number) => {
          updateLayerOption("backgroundLayer", { origin: new Vector2(uiState.originX, value) });
        });
        folder.add(layer, "raySpeed", 0.1, 3, 0.01).name("speed").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { raySpeed: value });
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
            updateLayerOption("backgroundLayer", { rayMotion: Number(value) });
          });
        folder
          .add(layer, "rayDepthMode", {
            "behind model": 0,
            "in front of model": 1,
            "behind and in front": 2,
          })
          .name("depth")
          .onChange((value: number) => {
            updateLayerOption("backgroundLayer", { rayDepthMode: Number(value) });
          });
        folder.add(layer, "raySpread", 0.2, 3, 0.01).name("spread").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { raySpread: value });
        });
        folder.add(layer, "rayLength", 0.05, 4, 0.01).name("length").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayLength: value });
        });
        folder.add(layer, "rayThickness", 0.005, 4, 0.001).name("thickness").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayThickness: value });
        });
        folder.add(layer, "raySoftness", 0.25, 3, 0.01).name("softness").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { raySoftness: value });
        });
        folder.add(layer, "rayCount", 1, 32, 1).name("count").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayCount: value });
        });
        folder.add(layer, "rayPulse").name("pulse reveal").onChange((value: boolean) => {
          updateLayerOption("backgroundLayer", { rayPulse: value });
        });
        folder.add(layer, "rayPulseSpeed", 0.05, 3, 0.01).name("pulse speed").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayPulseSpeed: value });
        });
        folder.add(layer, "rayPulseAmount", 0, 1, 0.01).name("pulse amount").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayPulseAmount: value });
        });
        folder.add(layer, "rayPulseStagger", 0, 2, 0.01).name("pulse stagger").onChange((value: number) => {
          updateLayerOption("backgroundLayer", { rayPulseStagger: value });
        });
      };

      bindLayerControls("Light Rays");

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

      const modelState = options.model;
      if (modelState) {
        const modelFolder = gui.addFolder("Model");
        modelFolder.add(modelState, "visible").name("visible").onChange((value: boolean) => {
          godrays.updateOptions({
            model: {
              visible: value,
            },
          });
        });
        modelFolder.close();
      }

      const textState = options.heroText;
      if (textState) {
        const textFolder = gui.addFolder("Text");
        textFolder.add(textState, "visible").name("visible").onChange((value: boolean) => {
          godrays.updateOptions({ heroText: { visible: value } });
        });
        textFolder.addColor(textState, "color").name("color").onChange((value: string) => {
          godrays.updateOptions({ heroText: { color: value } });
        });
        textFolder.close();
      }

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
