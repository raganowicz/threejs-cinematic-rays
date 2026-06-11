import { Vector2, Vector3 } from "three";

export type GodraysLayerName = "background" | "foreground";

export interface GodraysBackgroundOptions {
  transparent: boolean;
  color: string;
}

export interface GodRaysOptions {
  angle?: number;
  color?: Vector3;
  intensity?: number;
  opacity?: number;
  origin?: Vector2;
  visible?: boolean;
  z?: number;
}

export interface GodraysSceneOptions {
  background: GodraysBackgroundOptions;
  backgroundLayer: GodRaysOptions;
  foregroundLayer: GodRaysOptions;
}

export interface GodraysOptionsPatch {
  background?: Partial<GodraysBackgroundOptions>;
  backgroundLayer?: GodRaysOptions;
  foregroundLayer?: GodRaysOptions;
}

export const DEFAULT_GODRAYS_OPTIONS: GodraysSceneOptions = {
  background: {
    transparent: false,
    color: "#1e2226",
  },
  backgroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: -2.3,
    intensity: 0.18,
    opacity: 0.58,
    origin: new Vector2(1.48, 1.86),
    visible: true,
    z: -0.9,
  },
  foregroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: -2.3,
    intensity: 0.16,
    opacity: 0.54,
    origin: new Vector2(1.48, 1.86),
    visible: true,
    z: 0.48,
  },
};

export const createDefaultGodraysOptions = (): GodraysSceneOptions => ({
  background: { ...DEFAULT_GODRAYS_OPTIONS.background },
  backgroundLayer: {
    ...DEFAULT_GODRAYS_OPTIONS.backgroundLayer,
    color: new Vector3(0.612, 0.639, 0.651),
    origin: new Vector2(1.48, 1.86),
  },
  foregroundLayer: {
    ...DEFAULT_GODRAYS_OPTIONS.foregroundLayer,
    color: new Vector3(0.612, 0.639, 0.651),
    origin: new Vector2(1.48, 1.86),
  },
});
