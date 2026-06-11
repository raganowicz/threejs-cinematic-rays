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
  raySpeed?: number;
  beamFocus?: number;
  raySpread?: number;
  rayCount?: number;
  raySeed?: number;
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

const DEFAULT_RAY_ANGLE = -2.3;
const DEFAULT_RAY_ORIGIN = new Vector2(1.48, 1.86);

export const DEFAULT_GODRAYS_OPTIONS: GodraysSceneOptions = {
  background: {
    transparent: false,
    color: "#0d1117",
  },
  backgroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    intensity: 0.75,
    opacity: 0.58,
    origin: DEFAULT_RAY_ORIGIN.clone(),
    visible: true,
    z: -0.9,
    raySpeed: 0.62,
    beamFocus: 1.0,
    raySpread: 1.0,
    rayCount: 8,
  },
  foregroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    intensity: .8,
    opacity: 0.54,
    origin: DEFAULT_RAY_ORIGIN.clone(),
    visible: true,
    z: 0.48,
    raySpeed: 0.62,
    beamFocus: 1.0,
    raySpread: 1.0,
    rayCount: 8,
  },
};

export const createDefaultGodraysOptions = (): GodraysSceneOptions => ({
  background: { ...DEFAULT_GODRAYS_OPTIONS.background },
  backgroundLayer: {
    ...DEFAULT_GODRAYS_OPTIONS.backgroundLayer,
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    origin: DEFAULT_RAY_ORIGIN.clone(),
  },
  foregroundLayer: {
    ...DEFAULT_GODRAYS_OPTIONS.foregroundLayer,
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    origin: DEFAULT_RAY_ORIGIN.clone(),
  },
});
