import {
  AddEquation,
  CustomBlending,
  Mesh,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
  Vector3,
  ZeroFactor,
  Color,
} from "three";
import type { GodRaysOptions } from "./types";

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uAspect;
uniform float uSheetOverscan;
uniform float uAngle;
uniform float uRaySpeed;
uniform float uRayDirection;
uniform int uRayMotion;
uniform float uRaySpread;
uniform float uRayLength;
uniform float uRayBrightness;
uniform float uRayThickness;
uniform float uRaySoftness;
uniform int uRayCount;
uniform float uRaySeed;
uniform float uRayPulse;
uniform float uRayPulseSpeed;
uniform float uRayPulseAmount;
uniform float uRayPulseStagger;
uniform vec2 uOrigin;
uniform vec3 uColor;
uniform vec3 uBgColor;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float clamp01(float value) {
  return clamp(value, 0.0, 1.0);
}

float angularDistance(float a, float b) {
  return abs(atan(sin(a - b), cos(a - b)));
}

float dither(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float pulseReveal(float phase) {
  if (uRayPulse < 0.5) {
    return 1.0;
  }

  float wave = 0.5 + 0.5 * sin((uTime + uRaySeed * 0.37) * 0.62 * uRayPulseSpeed + phase);
  return mix(1.0, smoothstep(0.06, 0.94, wave), uRayPulseAmount);
}

void main() {
  vec2 uv = (vUv - 0.5) * uSheetOverscan + 0.5;
  float t = (uTime + uRaySeed * 0.37) * 0.62 * uRaySpeed;
  float motionSign = (uRayMotion == 0 || uRayMotion == 3) ? 1.0 : -1.0;

  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  vec2 o = vec2((uOrigin.x - 0.5) * uAspect, uOrigin.y - 0.5);
  vec2 toPoint = p - o;
  vec2 rayDir = normalize(vec2(cos(uAngle), sin(uAngle)));
  vec2 rayNormal = vec2(-rayDir.y, rayDir.x);
  float pointAngle = atan(toPoint.y, toPoint.x);
  float sourceDistance = length(toPoint);
  float rayLength = max(uRayLength, 0.05);
  float rayLengthT = clamp01((rayLength - 0.05) / 3.95);

  float depth = dot(toPoint, rayDir);
  float cross = dot(toPoint, rayNormal);
  float falloffDepth = max(depth - 2.75, 0.0);

  float entryFade = smoothstep(-0.18, 0.38, depth);
  float depthFade = 1.0 - smoothstep(mix(1.2, 7.4, rayLengthT), mix(1.8, 10.2, rayLengthT), depth);
  float distanceFalloff = exp(-falloffDepth * mix(0.62, 0.025, rayLengthT));
  float sourceFade = smoothstep(0.08, 0.42, sourceDistance);

  float broadWash = exp(-abs(cross) * 0.72);
  broadWash *= entryFade * (0.34 + 0.66 * depthFade) * (0.5 + 0.5 * distanceFalloff);
  broadWash *= 0.98 + 0.02 * sin(t * 0.12);
  broadWash *= pulseReveal(0.0);

  float shafts = 0.0;
  float rayCountF = max(float(uRayCount), 1.0);

  for (int i = 0; i < 32; i++) {
    if (i >= uRayCount) break;
    float fi = float(i);
    float seed = hash(fi * 7.137 + 2.41 + uRaySeed * 0.71);
    float speedSeed = hash(fi * 2.91 + 6.0 + uRaySeed * 0.43);
    float lane = (fi + 0.5) / rayCountF;
    float laneOffset = mix(-0.58, 0.46, lane);
    float drift = 0.0;

    if (uRayMotion < 2) {
      float movingLane = fract(lane + t * motionSign * mix(0.018, 0.055, speedSeed));
      laneOffset = mix(-0.72, 0.58, movingLane);
      drift = sin(t * 0.07 + seed * 6.28318530718) * 0.012;
    } else {
      float orbitT = t * motionSign;
      drift = sin(orbitT * mix(0.07, 0.2, speedSeed) + seed * 6.28318530718) * 0.08;
      drift += sin(orbitT * mix(0.025, 0.08, seed) + fi * 1.7) * 0.035;
    }

    float angleOffset = (laneOffset + drift) * uRaySpread;
    float wrapFade = smoothstep(-0.72 * uRaySpread, -0.54 * uRaySpread, angleOffset) *
      (1.0 - smoothstep(0.42 * uRaySpread, 0.58 * uRaySpread, angleOffset));
    float thickness = max(uRayThickness, 0.005);
    float edgeSoftness = max(uRaySoftness, 0.1);
    float baseWidth = mix(0.024, 0.07, hash(fi * 3.71 + 8.0 + uRaySeed * 0.17));
    float width = max(baseWidth * thickness, 0.00075);
    float microSpread = mix(-0.018, 0.018, hash(fi * 9.7 + 0.8 + uRaySeed * 0.31));
    float beamAngle = uAngle + angleOffset + microSpread;
    float angleDelta = angularDistance(pointAngle, beamAngle);
    float localDepth = sourceDistance * cos(angleDelta);

    float distanceToBeam = angleDelta / width;
    float beam = exp(-pow(distanceToBeam, 2.0 / edgeSoftness));
    float companionSeed = hash(fi * 10.13 + 2.6 + uRaySeed * 0.59);
    float companionAngle = angleOffset + mix(-0.1, 0.1, companionSeed) * uRaySpread;
    float companionDistance = angularDistance(pointAngle, uAngle + companionAngle) / (width * mix(0.75, 1.2, companionSeed));
    float companion = exp(-pow(companionDistance, 2.0 / edgeSoftness)) * smoothstep(0.58, 0.98, companionSeed) * 0.18;
    beam += companion;

    float softness = 0.92 + 0.08 * sin(t * (0.04 + seed * 0.05) + fi * 1.4);
    float localEntryFade = smoothstep(-0.16, 0.36, localDepth);
    float tailStart = mix(0.55, 14.0, rayLengthT);
    float tailSoftness = mix(0.22, 5.6, rayLengthT);
    float rayTailFade = 1.0 - smoothstep(tailStart, tailStart + tailSoftness, max(localDepth, 0.0));
    float rayFalloff = rayTailFade;
    float pulse = 0.98 + 0.02 * sin(t * (0.05 + seed * 0.05) + fi * 1.9);
    float rayStrength = mix(0.22, 0.68, hash(fi * 5.33 + 3.3 + uRaySeed * 0.23));

    float rayReveal = pulseReveal(fi * uRayPulseStagger);
    shafts += beam * wrapFade * softness * localEntryFade * sourceFade * rayFalloff * pulse * rayStrength * rayReveal;
  }

  shafts = (shafts / (1.0 + shafts * 0.52)) * max(uRayBrightness, 0.0);

  float atmosphere = broadWash * 0.055 + shafts * 0.36;
  float bloom = pow(clamp01(broadWash * 0.18 + shafts * 0.72), 1.24) * 0.2;
  float totalLight = (atmosphere + bloom) * uIntensity;
  float grain = dither(gl_FragCoord.xy);
  totalLight = max(totalLight + (grain - 0.5) / 96.0, 0.0);

  vec3 col = uBgColor + uColor * totalLight;
  col += (grain - 0.5) / 150.0;

  vec3 lightDelta = max(clamp(col, 0.0, 1.0) - uBgColor, 0.0);
  float alpha = clamp01((broadWash * 0.055 + shafts * 0.74 + bloom) * uOpacity + (grain - 0.5) / 180.0);
  gl_FragColor = vec4(lightDelta, alpha);
}
`;

export class SpatialGodRays {
  private readonly geometry = new PlaneGeometry(1, 1);
  private readonly sheets: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  private readonly materials: ShaderMaterial[] = [];
  private elapsedTime = 0;
  private lastAspect = 1;
  private lastCamera?: PerspectiveCamera;
  private lastWidth = 1;
  private lastHeight = 1;
  private options: GodRaysOptions;

  constructor(options: GodRaysOptions) {
    this.options = options;
    this.createSheet(options.z ?? -1.8, 0, 1, true);
    this.createSheet(options.frontZ ?? 0.45, 0.31, 0.62, false);
    this.applyOptions(options);
  }

  get meshes(): Mesh<PlaneGeometry, ShaderMaterial>[] {
    return this.sheets;
  }

  update(delta: number): void {
    this.elapsedTime += delta;

    for (const material of this.materials) {
      material.uniforms.uTime.value = this.elapsedTime;
    }
  }

  resize(camera: PerspectiveCamera, width: number, height: number): void {
    this.lastAspect = width / Math.max(height, 1);
    this.lastCamera = camera;
    this.lastWidth = width;
    this.lastHeight = height;

    this.updateSheetScale(camera, width, height);

    for (const material of this.materials) {
      material.uniforms.uAspect.value = this.lastAspect;
    }
  }

  setVisible(visible: boolean): void {
    const depthMode = Math.floor(this.sanitize(this.options.rayDepthMode, 2, 0, 2));

    this.sheets[0].visible = visible && depthMode !== 1;
    this.sheets[1].visible = visible && depthMode !== 0;
  }

  applyOptions(options: GodRaysOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };
    const color = this.options.color ?? new Vector3(0.612, 0.639, 0.651);
    const origin = this.options.origin ?? new Vector2(1.48, 1.86);
    const backZ = this.sanitize(this.options.z, -1.8, -10, 10);
    const frontZ = this.sanitize(this.options.frontZ, 0.45, -10, 10);
    const depthMode = Math.floor(this.sanitize(this.options.rayDepthMode, 2, 0, 2));
    const totalRayCount = Math.floor(this.sanitize(this.options.rayCount, 8, 1, 32));
    const rayCounts = depthMode === 0
      ? [totalRayCount, 0]
      : depthMode === 1
        ? [0, totalRayCount]
        : [Math.ceil(totalRayCount / 2), Math.floor(totalRayCount / 2)];

    this.sheets[0].position.z = backZ;
    this.sheets[0].renderOrder = backZ < 0 ? 0 : 2;
    this.sheets[1].position.z = frontZ;
    this.sheets[1].renderOrder = frontZ < 0 ? 0 : 2;

    for (const [index, material] of this.materials.entries()) {
      material.uniforms.uIntensity.value = this.sanitize(this.options.intensity, 0.75, 0, 10);
      material.uniforms.uOpacity.value = this.sanitize(this.options.opacity, 0.58, 0, 1);
      material.uniforms.uAngle.value = this.sanitize(this.options.angle, -2.3, -Math.PI * 2, Math.PI * 2);
      material.uniforms.uRaySpeed.value = this.sanitize(this.options.raySpeed, 0.62, 0, 10);
      material.uniforms.uRayDirection.value = this.options.rayDirection ?? -1;
      material.uniforms.uRayMotion.value = this.options.rayMotion ?? 0;
      material.uniforms.uRaySpread.value = this.sanitize(this.options.raySpread, 1, 0, 10);
      material.uniforms.uRayLength.value = this.sanitize(this.options.rayLength, 1.4, 0.05, 4);
      material.uniforms.uRayBrightness.value = this.sanitize(this.options.rayBrightness, 1, 0, 8);
      material.uniforms.uRayThickness.value = this.sanitize(this.options.rayThickness, 0.32, 0.005, 10);
      material.uniforms.uRaySoftness.value = this.sanitize(this.options.raySoftness, 1, 0.25, 3);
      material.uniforms.uRayCount.value = rayCounts[index] ?? 0;
      material.uniforms.uRayPulse.value = this.options.rayPulse ? 1 : 0;
      material.uniforms.uRayPulseSpeed.value = this.sanitize(this.options.rayPulseSpeed, 0.35, 0.05, 3);
      material.uniforms.uRayPulseAmount.value = this.sanitize(this.options.rayPulseAmount, 1, 0, 1);
      material.uniforms.uRayPulseStagger.value = this.sanitize(this.options.rayPulseStagger, 0.45, 0, 2);
      material.uniforms.uOrigin.value.copy(origin);
      material.uniforms.uColor.value.setRGB(color.x, color.y, color.z);
      material.uniforms.uAspect.value = this.lastAspect;
    }

    if (this.lastCamera) {
      this.updateSheetScale(this.lastCamera, this.lastWidth, this.lastHeight);
    }

    this.setVisible(this.options.visible ?? true);
  }

  dispose(): void {
    this.geometry.dispose();

    for (const material of this.materials) {
      material.dispose();
    }
  }

  private sanitize(value: number | undefined, fallback: number, min: number, max: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, value));
  }

  private getSheetOverscan(): number {
    const rayLength = this.sanitize(this.options.rayLength, 1.4, 0.05, 4);
    const lengthT = (rayLength - 0.05) / 3.95;

    return 1.1 + Math.pow(lengthT, 3) * 4.4;
  }

  private updateSheetScale(camera: PerspectiveCamera, width: number, height: number): void {
    this.lastAspect = width / Math.max(height, 1);
    const overscan = this.getSheetOverscan();

    for (const sheet of this.sheets) {
      const distance = Math.max(camera.position.z - sheet.position.z, 0.01);
      const viewportHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      const viewportWidth = viewportHeight * this.lastAspect;

      sheet.scale.set(viewportWidth * overscan, viewportHeight * overscan, 1);
    }

    for (const material of this.materials) {
      material.uniforms.uSheetOverscan.value = overscan;
      material.uniforms.uAspect.value = this.lastAspect;
    }
  }

  private createSheet(z: number, seedOffset: number, energy: number, depthTest: boolean): void {
    const color = this.options.color ?? new Vector3(0.612, 0.639, 0.651);
    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: (this.options.intensity ?? 0.75) * energy },
        uOpacity: { value: (this.options.opacity ?? 0.58) * energy },
        uAspect: { value: 1 },
        uSheetOverscan: { value: this.getSheetOverscan() },
        uAngle: { value: this.options.angle ?? -2.3 },
        uRaySpeed: { value: this.options.raySpeed ?? 0.62 },
        uRayDirection: { value: this.options.rayDirection ?? -1 },
        uRayMotion: { value: this.options.rayMotion ?? 0 },
        uRaySpread: { value: this.options.raySpread ?? 1 },
        uRayLength: { value: this.options.rayLength ?? 1.4 },
        uRayBrightness: { value: this.options.rayBrightness ?? 1 },
        uRayThickness: { value: this.options.rayThickness ?? 0.32 },
        uRaySoftness: { value: this.options.raySoftness ?? 1 },
        uRayCount: { value: Math.floor(this.options.rayCount ?? 8) },
        uRaySeed: { value: 17.13 + seedOffset },
        uRayPulse: { value: this.options.rayPulse ? 1 : 0 },
        uRayPulseSpeed: { value: this.options.rayPulseSpeed ?? 0.35 },
        uRayPulseAmount: { value: this.options.rayPulseAmount ?? 1 },
        uRayPulseStagger: { value: this.options.rayPulseStagger ?? 0.45 },
        uOrigin: { value: (this.options.origin ?? new Vector2(1.48, 1.86)).clone() },
        uColor: { value: new Color(color.x, color.y, color.z) },
        uBgColor: { value: new Vector3(0.118, 0.133, 0.149) },
      },
      transparent: true,
      depthTest,
      depthWrite: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneFactor,
      blendEquationAlpha: AddEquation,
      blendSrcAlpha: ZeroFactor,
      blendDstAlpha: OneFactor,
      dithering: true,
      precision: "highp",
    });
    const sheet = new Mesh(this.geometry, material);

    sheet.position.z = z;
    sheet.renderOrder = z < 0 ? 0 : 2;
    this.sheets.push(sheet);
    this.materials.push(material);
  }
}
