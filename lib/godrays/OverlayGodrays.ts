import {
  AddEquation,
  Clock,
  Color,
  CustomBlending,
  Mesh,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
  Vector3,
  WebGLRenderer,
  ZeroFactor,
} from "three";
import {
  mergeGodraysOptions,
  type GodraysLayerName,
  type GodRaysOptions,
  type GodraysOptionsPatch,
  type GodraysSceneOptions,
} from "./types";

const GODRAYS_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const GODRAYS_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uIntensity;
uniform float uOpacity;
uniform vec3  uColor;
uniform vec3  uBgColor;
uniform vec2  uOrigin;
uniform float uAngle;
uniform float uRaySpeed;
uniform float uRayDirection;
uniform float uRaySpread;
uniform float uRayLength;
uniform float uRayBrightness;
uniform float uRayThickness;
uniform float uRaySoftness;
uniform int uRayCount;
uniform float uRaySeed;

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

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv;
  float t = (uTime + uRaySeed * 0.37) * uRaySpeed * uRayDirection;
  float beamAA = 1.2 / max(uResolution.y, 1.0);

  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  vec2 o = vec2((uOrigin.x - 0.5) * aspect, uOrigin.y - 0.5);
  vec2 toPoint = p - o;
  vec2 rayDir = normalize(vec2(cos(uAngle), sin(uAngle)));
  vec2 rayNormal = vec2(-rayDir.y, rayDir.x);
  float pointAngle = atan(toPoint.y, toPoint.x);
  float sourceDistance = length(toPoint);
  float rayLength = max(uRayLength, 0.05);
  float rayLengthT = clamp01((rayLength - 0.05) / 3.95);

  float depth = dot(toPoint, rayDir);
  float cross = dot(toPoint, rayNormal);
  float falloffDepth = max(depth - 1.85, 0.0);

  float entryFade = smoothstep(-0.12, 0.25, depth);
  float depthFade = 1.0 - smoothstep(mix(0.65, 4.8, rayLengthT), mix(1.05, 6.8, rayLengthT), depth);
  float distanceFalloff = exp(-falloffDepth * mix(1.0, 0.035, rayLengthT));
  float floorFade = mix(smoothstep(0.16, 0.56, uv.y), 1.0, smoothstep(0.18, 0.72, rayLengthT));
  float topRightFade = smoothstep(-0.15, 0.78, uv.y) * smoothstep(-0.2, 0.85, uv.x);

  float broadWash = exp(-abs(cross - 0.12) * 0.58);
  broadWash *= entryFade * (0.35 + 0.65 * depthFade) * (0.42 + 0.58 * distanceFalloff) * (0.18 + 0.82 * floorFade);
  broadWash *= 0.9 + 0.1 * sin(t * 0.18);

  float shafts = 0.0;

  for (int i = 0; i < 32; i++) {
    if (i >= uRayCount) break;
    float fi = float(i);
    float seed = hash(fi * 7.137 + 2.41 + uRaySeed * 0.71);
    float speedSeed = hash(fi * 2.91 + 6.0 + uRaySeed * 0.43);
    float phase = seed * 6.28318530718;
    float drift = sin(t * mix(0.10, 0.28, speedSeed) + phase);
    float counterDrift = sin(t * mix(0.035, 0.11, seed) + phase * 1.7) * 0.34;
    float staticOffset = mix(-0.30, 0.24, hash(fi * 6.11 + 4.2 + uRaySeed * 0.29));
    float angleOffset = (staticOffset + (drift + counterDrift) * 0.28) * uRaySpread;
    float wrapFade = 1.0;
    float baseWidth = mix(0.018, 0.072, hash(fi * 3.71 + 8.0 + uRaySeed * 0.17));
    float width = max(baseWidth * uRayThickness, 0.00075);
    float edgeSoftness = max(uRaySoftness, 0.1);
    float microSpread = mix(-0.024, 0.024, hash(fi * 9.7 + 0.8 + uRaySeed * 0.31));
    float beamAngle = uAngle + angleOffset + microSpread;
    float angleDelta = angularDistance(pointAngle, beamAngle);
    float localDepth = sourceDistance * cos(angleDelta);

    float distanceToBeam = angleDelta / (width + beamAA);
    float beam = exp(-pow(distanceToBeam, 2.0 / edgeSoftness));
    float companionSeed = hash(fi * 10.13 + 2.6 + uRaySeed * 0.59);
    float companionAngle = angleOffset + mix(-0.08, 0.08, companionSeed);
    float companionDistance = angularDistance(pointAngle, uAngle + companionAngle) / (width * mix(0.55, 0.9, companionSeed));
    float companion = exp(-pow(companionDistance, 2.0 / edgeSoftness)) * smoothstep(0.58, 0.98, companionSeed) * 0.22;
    beam += companion;

    float softness = 0.82 + 0.18 * sin(t * (0.08 + seed * 0.08) + fi * 1.4);
    float localEntryFade = smoothstep(-0.12, 0.25, localDepth);
    float tailStart = mix(0.35, 9.2, rayLengthT);
    float tailSoftness = mix(0.16, 3.8, rayLengthT);
    float rayTailFade = 1.0 - smoothstep(tailStart, tailStart + tailSoftness, max(localDepth, 0.0));
    float rayFalloff = rayTailFade;
    float pulse = 0.94 + 0.06 * sin(t * (0.08 + seed * 0.08) + fi * 1.9);
    float rayStrength = mix(0.1, 0.46, hash(fi * 5.33 + 3.3 + uRaySeed * 0.23));

    shafts += beam * wrapFade * softness * localEntryFade * floorFade * rayFalloff * pulse * rayStrength;
  }

  shafts = (shafts / (1.0 + shafts * 0.42)) * max(uRayBrightness, 0.0);

  float surfaceGlow = topRightFade * exp(-falloffDepth * 0.62) * 0.08;
  float atmosphere = broadWash * 0.12 + shafts * 0.2 + surfaceGlow;
  float bloom = pow(clamp01(broadWash * 0.48 + shafts * 0.4), 1.38) * 0.17;
  float totalLight = (atmosphere + bloom) * uIntensity;

  vec3 col = uBgColor + uColor * totalLight;
  float grain = dither(gl_FragCoord.xy + vec2(t * 43.0, t * 37.0));
  col += (grain - 0.5) / 192.0;

  vec3 lightDelta = max(clamp(col, 0.0, 1.0) - uBgColor, 0.0);
  gl_FragColor = vec4(lightDelta, uOpacity);
}
`;

class OverlayRayLayer {
  private readonly geometry = new PlaneGeometry(2, 2);
  private material: ShaderMaterial;
  private elapsedTime = 0;
  private lastCameraZ = Number.NaN;
  private lastHeight = 0;
  private lastWidth = 0;

  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;

  constructor(options: GodRaysOptions = {}) {
    const {
      angle = -2.3,
      color = new Vector3(0.612, 0.639, 0.651),
      intensity = 0.2,
      opacity = 1,
      origin = new Vector2(1.48, 1.86),
      visible = true,
      z = 0,
      raySpeed = 1.0,
      rayDirection = -1.0,
      raySpread = 1.0,
      rayLength = 1.4,
      rayBrightness = 1.0,
      rayThickness = 1.0,
      raySoftness = 1.0,
      rayCount = 8,
      raySeed = Math.random() * 1000,
    } = options;

    this.material = new ShaderMaterial({
      vertexShader: GODRAYS_VERTEX_SHADER,
      fragmentShader: GODRAYS_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
        uIntensity: { value: intensity },
        uOpacity: { value: opacity },
        uColor: { value: color },
        uBgColor: { value: new Vector3(0.118, 0.133, 0.149) },
        uOrigin: { value: origin },
        uAngle: { value: angle },
        uRaySpeed: { value: raySpeed },
        uRayDirection: { value: rayDirection },
        uRaySpread: { value: raySpread },
        uRayLength: { value: rayLength },
        uRayBrightness: { value: rayBrightness },
        uRayThickness: { value: rayThickness },
        uRaySoftness: { value: raySoftness },
        uRayCount: { value: rayCount },
        uRaySeed: { value: raySeed },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneFactor,
      blendEquationAlpha: AddEquation,
      blendSrcAlpha: ZeroFactor,
      blendDstAlpha: OneFactor,
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.z = z;
    this.mesh.visible = visible;
  }

  update(delta: number): void {
    if (!this.mesh.visible) {
      return;
    }

    this.elapsedTime += delta;
    this.material.uniforms.uTime.value = this.elapsedTime;
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }

  setIntensity(intensity: number): void {
    this.material.uniforms.uIntensity.value = intensity;
  }

  setOpacity(opacity: number): void {
    this.material.uniforms.uOpacity.value = opacity;
  }

  setAngle(angle: number): void {
    this.material.uniforms.uAngle.value = angle;
  }

  setOrigin(x: number, y: number): void {
    this.material.uniforms.uOrigin.value.set(x, y);
  }

  setColor(color: Vector3): void {
    this.material.uniforms.uColor.value.copy(color);
  }

  setRaySpeed(speed: number): void {
    this.material.uniforms.uRaySpeed.value = speed;
  }

  setRayDirection(direction: number): void {
    this.material.uniforms.uRayDirection.value = direction >= 0 ? 1 : -1;
  }

  setRaySpread(spread: number): void {
    this.material.uniforms.uRaySpread.value = spread;
  }

  setRayLength(length: number): void {
    this.material.uniforms.uRayLength.value = Math.max(0.05, Math.min(4, length));
  }

  setRayBrightness(brightness: number): void {
    this.material.uniforms.uRayBrightness.value = Math.max(0, brightness);
  }

  setRayThickness(thickness: number): void {
    this.material.uniforms.uRayThickness.value = Math.max(0.005, thickness);
  }

  setRaySoftness(softness: number): void {
    this.material.uniforms.uRaySoftness.value = Math.max(0.25, Math.min(3, softness));
  }

  setRayCount(count: number): void {
    this.material.uniforms.uRayCount.value = Math.floor(Math.max(1, Math.min(32, count)));
  }

  setRaySeed(seed: number): void {
    this.material.uniforms.uRaySeed.value = seed;
  }

  resize(camera: PerspectiveCamera, width: number, height: number): void {
    const cameraChanged = Math.abs(camera.position.z - this.lastCameraZ) > 0.001;
    if (width === this.lastWidth && height === this.lastHeight && !cameraChanged) {
      return;
    }

    this.lastWidth = width;
    this.lastHeight = height;
    this.lastCameraZ = camera.position.z;
    this.material.uniforms.uResolution.value.set(width, height);

    const distance = Math.max(camera.position.z - this.mesh.position.z, 0.01);
    const viewportHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
    const viewportWidth = viewportHeight * camera.aspect;
    this.mesh.scale.set(viewportWidth, viewportHeight, 1);
  }

  destroy(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

interface OverlayGodraysConfig {
  mount: HTMLElement;
  options?: GodraysOptionsPatch;
  pixelRatio?: number;
}

export class OverlayGodrays {
  readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(28, 1, 0.1, 100);
  private readonly clock = new Clock();
  private readonly layers: Record<GodraysLayerName, OverlayRayLayer>;
  private options: GodraysSceneOptions;

  constructor(config: OverlayGodraysConfig) {
    this.options = mergeGodraysOptions(config.options);

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(config.pixelRatio ?? Math.min(window.devicePixelRatio, 1.75));

    this.layers = {
      background: new OverlayRayLayer({
        ...this.options.backgroundLayer,
      }),
      foreground: new OverlayRayLayer(
        this.options.foregroundLayer
          ? { ...this.options.foregroundLayer }
          : { ...this.options.backgroundLayer, visible: false, opacity: 0 },
      ),
    };

    this.layers.background.mesh.renderOrder = 0;
    this.layers.foreground.mesh.renderOrder = 2;

    this.camera.position.z = 5.95;

    this.scene.add(this.layers.background.mesh);
    this.scene.add(this.layers.foreground.mesh);

    this.applyBackground();

    config.mount.appendChild(this.renderer.domElement);
    this.setSize(config.mount.clientWidth, config.mount.clientHeight);
  }

  setSize(width: number, height: number): void {
    if (height <= 0) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.layers.background.resize(this.camera, width, height);
    this.layers.foreground.resize(this.camera, width, height);
  }

  render(): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.layers.background.update(delta);
    this.layers.foreground.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  updateOptions(options: GodraysOptionsPatch): void {
    if (options.background) {
      this.options.background = {
        ...this.options.background,
        ...options.background,
      };
      this.applyBackground();
    }

    if (options.backgroundLayer) {
      this.options.backgroundLayer = {
        ...this.options.backgroundLayer,
        ...options.backgroundLayer,
      };
      this.applyLayerOptions(this.layers.background, options.backgroundLayer);
    }

    if (options.foregroundLayer && this.options.foregroundLayer) {
      this.options.foregroundLayer = {
        ...this.options.foregroundLayer,
        ...options.foregroundLayer,
      };
      this.applyLayerOptions(this.layers.foreground, options.foregroundLayer);
    }
  }

  dispose(): void {
    this.layers.background.destroy();
    this.layers.foreground.destroy();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private applyBackground(): void {
    if (this.options.background.transparent) {
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const color = new Color(this.options.background.color);
      this.renderer.setClearColor(color, 1);
    }
  }

  private applyLayerOptions(layer: OverlayRayLayer, patch: NonNullable<GodraysOptionsPatch["backgroundLayer"]>): void {
    if (typeof patch.visible === "boolean") {
      layer.setVisible(patch.visible);
    }

    if (typeof patch.intensity === "number") {
      layer.setIntensity(patch.intensity);
    }

    if (typeof patch.opacity === "number") {
      layer.setOpacity(patch.opacity);
    }

    if (typeof patch.angle === "number") {
      layer.setAngle(patch.angle);
    }

    if (patch.origin) {
      layer.setOrigin(patch.origin.x, patch.origin.y);
    }

    if (patch.color) {
      layer.setColor(patch.color);
    }

    if (typeof patch.raySpeed === "number") {
      layer.setRaySpeed(patch.raySpeed);
    }

    if (typeof patch.rayDirection === "number") {
      layer.setRayDirection(patch.rayDirection);
    }

    if (typeof patch.raySpread === "number") {
      layer.setRaySpread(patch.raySpread);
    }

    if (typeof patch.rayLength === "number") {
      layer.setRayLength(patch.rayLength);
    }

    if (typeof patch.rayBrightness === "number") {
      layer.setRayBrightness(patch.rayBrightness);
    }

    if (typeof patch.rayThickness === "number") {
      layer.setRayThickness(patch.rayThickness);
    }

    if (typeof patch.raySoftness === "number") {
      layer.setRaySoftness(patch.raySoftness);
    }

    if (typeof patch.rayCount === "number") {
      layer.setRayCount(patch.rayCount);
    }

    if (typeof patch.z === "number") {
      layer.mesh.position.z = patch.z;
    }
  }
}
