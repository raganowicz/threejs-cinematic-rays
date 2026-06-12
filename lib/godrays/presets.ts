import { Vector2, Vector3 } from "three";
import { mergeGodraysOptions, type GodraysOptionsPatch } from "./types";

/**
 * Starting values for the demo. Edit freely — delete any block you do not need.
 */
export const godraysPreset: GodraysOptionsPatch = {
  background: {
    transparent: false,
    color: "#0a0d15",
  },
  backgroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: -2.3,
    intensity: 0.75,
    opacity: 0.58,
    origin: new Vector2(1.48, 1.86),
    visible: true,
    z: -1.8,
    frontZ: 0.45,
    raySpeed: 0.62,
    rayDirection: -1,
    rayMotion: 0,
    rayDepthMode: 2,
    raySpread: 0.82,
    rayLength: 1.4,
    rayBrightness: 1.0,
    rayThickness: 0.42,
    raySoftness: 1.0,
    rayCount: 8,
  },

  // Optional — delete any of the blocks below if you do not use them:

  foregroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: -2.3,
    intensity: 0.8,
    opacity: 0.54,
    origin: new Vector2(1.48, 1.86),
    visible: true,
    z: 0.48,
    frontZ: 0.45,
    raySpeed: 0.62,
    rayDirection: -1,
    rayMotion: 0,
    rayDepthMode: 2,
    raySpread: 0.82,
    rayLength: 1.4,
    rayBrightness: 1.0,
    rayThickness: 0.42,
    raySoftness: 1.0,
    rayCount: 8,
  },

  model: {
    visible: true,
  },

  heroText: {
    color: "#EB6137",
    fontFamily: "Humane-Regular",
    text: "CINEMATIC RAYS",
    visible: true,
  },
};

export const createDefaultGodraysOptions = () => mergeGodraysOptions(godraysPreset);
