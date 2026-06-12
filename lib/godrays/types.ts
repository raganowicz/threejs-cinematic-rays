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
  raySpread?: number;
  rayLength?: number;
  rayBrightness?: number;
  rayThickness?: number;
  raySoftness?: number;
  rayCount?: number;
  raySeed?: number;
  rayPulse?: boolean;
  rayPulseSpeed?: number;
  rayPulseAmount?: number;
  rayPulseStagger?: number;
}

export interface GodraysSceneOptions {
  background: GodraysBackgroundOptions;
  backgroundLayer: GodRaysOptions;
  foregroundLayer?: GodRaysOptions;
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
const DEFAULT_RAY_COLOR = new Vector3(0.612, 0.639, 0.651);

export const FALLBACK_BACKGROUND: GodraysBackgroundOptions = {
  transparent: false,
  color: "#0a0d15",
};

export const FALLBACK_RAY_OPTIONS: GodRaysOptions = {
  color: DEFAULT_RAY_COLOR,
  angle: DEFAULT_RAY_ANGLE,
  intensity: 0.75,
  opacity: 0.58,
  origin: DEFAULT_RAY_ORIGIN.clone(),
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
};

/** Internal fallbacks used when a preset value is missing. */
export const DEFAULT_GODRAYS_OPTIONS: GodraysSceneOptions = {
  background: { ...FALLBACK_BACKGROUND },
  backgroundLayer: {
    ...FALLBACK_RAY_OPTIONS,
    color: DEFAULT_RAY_COLOR.clone(),
    origin: DEFAULT_RAY_ORIGIN.clone(),
  },
};

const cloneLayerOptions = (base: GodRaysOptions, patch?: GodRaysOptions): GodRaysOptions => {
  const merged = { ...base, ...patch };
  const color = merged.color ?? DEFAULT_RAY_COLOR;
  const origin = merged.origin ?? DEFAULT_RAY_ORIGIN;

  return {
    ...merged,
    color: color.clone(),
    origin: origin.clone(),
  };
};

export const mergeGodraysOptions = (patch: GodraysOptionsPatch = {}): GodraysSceneOptions => {
  const options: GodraysSceneOptions = {
    background: { ...FALLBACK_BACKGROUND, ...patch.background },
    backgroundLayer: cloneLayerOptions(FALLBACK_RAY_OPTIONS, patch.backgroundLayer),
  };

  if (patch.foregroundLayer) {
    options.foregroundLayer = cloneLayerOptions(FALLBACK_RAY_OPTIONS, patch.foregroundLayer);
  }

  if (patch.model) {
    options.model = { visible: true, ...patch.model };
  }

  if (patch.heroText) {
    options.heroText = {
      color: "#EB6137",
      fontFamily: "Humane-Regular",
      text: "",
      visible: true,
      ...patch.heroText,
    };
  }

  return options;
};
