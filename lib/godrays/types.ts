import { Vector2, Vector3 } from "three";

export type GodraysLayerName = "background" | "foreground";

export interface GodraysBackgroundOptions {
  transparent: boolean;
  color: string;
}

export interface GodraysModelOptions {
  visible: boolean;
}

export interface GodraysHeroTextOptions {
  color: string;
  fontFamily: string;
  text: string;
  visible: boolean;
}

export interface GodRaysOptions {
  angle?: number;
  color?: Vector3;
  intensity?: number;
  opacity?: number;
  origin?: Vector2;
  visible?: boolean;
  z?: number;
  frontZ?: number;
  raySpeed?: number;
  rayDirection?: number;
  rayMotion?: number;
  rayDepthMode?: number;
  beamFocus?: number;
  raySpread?: number;
  rayLength?: number;
  rayBrightness?: number;
  rayThickness?: number;
  rayCount?: number;
  raySeed?: number;
}

export interface GodraysSceneOptions {
  background: GodraysBackgroundOptions;
  backgroundLayer: GodRaysOptions;
  foregroundLayer: GodRaysOptions;
  model?: GodraysModelOptions;
  heroText?: GodraysHeroTextOptions;
}

export interface GodraysOptionsPatch {
  background?: Partial<GodraysBackgroundOptions>;
  backgroundLayer?: GodRaysOptions;
  foregroundLayer?: GodRaysOptions;
  model?: Partial<GodraysModelOptions>;
  heroText?: Partial<GodraysHeroTextOptions>;
}

const DEFAULT_RAY_ANGLE = -2.3;
const DEFAULT_RAY_ORIGIN = new Vector2(1.48, 1.86);

export const DEFAULT_GODRAYS_OPTIONS: GodraysSceneOptions = {
  background: {
    transparent: false,
    color: "#0a0d15",
  },
  backgroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    intensity: 0.75,
    opacity: 0.58,
    origin: DEFAULT_RAY_ORIGIN.clone(),
    visible: true,
    z: -1.8,
    frontZ: 0.45,
    raySpeed: 0.62,
    rayDirection: -1,
    rayMotion: 2,
    rayDepthMode: 2,
    beamFocus: 1.0,
    raySpread: 1.18,
    rayLength: 1.4,
    rayBrightness: 1.0,
    rayThickness: 0.32,
    rayCount: 10,
  },
  foregroundLayer: {
    color: new Vector3(0.612, 0.639, 0.651),
    angle: DEFAULT_RAY_ANGLE,
    intensity: .8,
    opacity: 0.54,
    origin: DEFAULT_RAY_ORIGIN.clone(),
    visible: true,
    z: 0.48,
    frontZ: 0.45,
    raySpeed: 0.62,
    rayDirection: -1,
    rayMotion: 2,
    rayDepthMode: 2,
    beamFocus: 1.0,
    raySpread: 1.18,
    rayLength: 1.4,
    rayBrightness: 1.0,
    rayThickness: 0.32,
    rayCount: 10,
  },
  model: {
    visible: true,
  },
  heroText: {
    color: "#EB6137",
    fontFamily: "Humane-Regular",
    text: "HERO GOD RAYS",
    visible: true,
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
  model: { ...(DEFAULT_GODRAYS_OPTIONS.model ?? { visible: true }) },
  heroText: { ...(DEFAULT_GODRAYS_OPTIONS.heroText ?? {
    color: "#EB6137",
    fontFamily: "Humane-Regular",
    text: "HERO GOD RAYS",
    visible: true,
  }) },
});
